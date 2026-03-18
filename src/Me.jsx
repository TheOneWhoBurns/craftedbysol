import { useRef, useEffect, useState } from 'react'
import Matter from 'matter-js'
import { useWebHaptics } from 'web-haptics/react'
import usfqLogo from './assets/usfq-logo.png'
import './Me.css'

const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events } = Matter

const BADGES = [
  { id: 1, label: 'AWS CloudOps Engineer', img: 'https://images.credly.com/size/340x340/images/88a6405e-0f26-442a-95ed-f9b9db4c857e/blob', r: 120 },
  { id: 2, label: 'AWS Cloud Practitioner', img: 'https://images.credly.com/size/340x340/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png', r: 120 },
  { id: 3, label: 'AWS Sales Accreditation', img: 'https://images.credly.com/size/340x340/images/46ea4542-72a8-46a1-8d68-b72c4ca50820/blob', r: 110 },
  { id: 4, label: 'AWS Technical Accredited', img: 'https://images.credly.com/size/340x340/images/8f006312-3154-45bf-a845-4a043641e83c/blob', r: 110 },
  { id: 5, label: 'USFQ', img: usfqLogo, isLogo: true, sub: 'B.S. in Computer Science', r: 160 },
]

const USFQ_IDX = 4
const GRAVITY_STRENGTH = 0.0006
const MAX_SPEED = 12

function Me() {
  const containerRef = useRef(null)
  const engineRef = useRef(null)
  const bodiesRef = useRef([])
  const rafRef = useRef(null)
  const mouseConstraintRef = useRef(null)
  const [positions, setPositions] = useState([])
  const [dragIdx, setDragIdx] = useState(null)
  const { trigger } = useWebHaptics({ debug: true })
  const triggerRef = useRef(trigger)
  triggerRef.current = trigger

  useEffect(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    /* USFQ center: upper-center area, leaving room for bio at bottom-left */
    const cx = w * 0.60
    const cy = h * 0.40

    const engine = Engine.create({ gravity: { x: 0, y: 0 } })
    engineRef.current = engine

    /* boundary walls — pushed outside viewport so badges can go to edges */
    const t = 200
    const pad = 150
    const walls = [
      Bodies.rectangle(w / 2, -t / 2 - pad, w + 400, t, { isStatic: true }),       // top
      Bodies.rectangle(w / 2, h + t / 2 + pad, w + 400, t, { isStatic: true }),     // bottom
      Bodies.rectangle(-t / 2 - pad, h / 2, t, h + 400, { isStatic: true }),        // left
      Bodies.rectangle(w + t / 2 + pad, h / 2, t, h + 400, { isStatic: true }),     // right
    ]

    /* badge bodies — circles for clean collision */
    const startPositions = [
      { x: cx - 130, y: cy - 140 },  // CloudOps — up-left
      { x: cx - 290, y: cy + 110 },  // Cloud Practitioner — left
      { x: cx + 290, y: cy + 150 },  // Sales Accreditation — right
      { x: cx + 130, y: cy - 140 },  // Technical Accredited — up-right
      { x: cx, y: cy + 150 },        // USFQ center
    ]

    const bodies = BADGES.map((badge, i) => {
      const body = Bodies.circle(startPositions[i].x, startPositions[i].y, badge.r, {
        restitution: 0,
        friction: 0.1,
        frictionAir: 0.06,
        density: i === USFQ_IDX ? 0.008 : 0.002,
        label: `badge-${i}`,
      })
      /* USFQ is static until dragged */
      if (i === USFQ_IDX) Body.setStatic(body, true)
      return body
    })

    bodiesRef.current = bodies
    World.add(engine.world, [...walls, ...bodies])

    /* mouse constraint for drag */
    const mouse = Mouse.create(containerRef.current)
    /* prevent scroll hijacking */
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel)
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel)

    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.5, damping: 0.2, render: { visible: false } },
    })
    mouseConstraintRef.current = mc
    World.add(engine.world, mc)

    /* haptic on grab/release */
    Events.on(mc, 'startdrag', (e) => {
      const idx = bodies.indexOf(e.body)
      if (idx >= 0) {
        setDragIdx(idx)
        if (idx === USFQ_IDX) Body.setStatic(e.body, false)
        triggerRef.current('success')
      }
    })
    Events.on(mc, 'enddrag', (e) => {
      const idx = bodies.indexOf(e.body)
      setDragIdx(null)
      if (idx === USFQ_IDX) {
        Body.setVelocity(e.body, { x: 0, y: 0 })
        Body.setStatic(e.body, true)
      }
      triggerRef.current('success')
    })

    /* physics loop */
    const step = () => {
      /* gravity: pull non-USFQ badges toward USFQ, but only when not already touching */
      const usfqPos = bodies[USFQ_IDX].position
      for (let i = 0; i < bodies.length; i++) {
        if (i === USFQ_IDX) continue
        const b = bodies[i]
        const dx = usfqPos.x - b.position.x
        const dy = usfqPos.y - b.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const touchDist = BADGES[i].r + BADGES[USFQ_IDX].r
        if (dist > touchDist + 10) {
          const force = GRAVITY_STRENGTH * b.mass
          Body.applyForce(b, b.position, {
            x: (dx / dist) * force,
            y: (dy / dist) * force,
          })
        }
      }

      Engine.update(engine, 1000 / 60)

      /* clamp velocity so badges can never tunnel through walls */
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        const vx = b.velocity.x
        const vy = b.velocity.y
        const speed = Math.sqrt(vx * vx + vy * vy)
        if (speed > MAX_SPEED) {
          const scale = MAX_SPEED / speed
          Body.setVelocity(b, { x: vx * scale, y: vy * scale })
        }
        /* safety net: if a body escapes past the walls, bring it back */
        const r = BADGES[i].r
        const limit = pad + r
        if (b.position.x < -limit || b.position.x > w + limit || b.position.y < -limit || b.position.y > h + limit) {
          Body.setPosition(b, {
            x: Math.max(-pad, Math.min(w + pad, b.position.x)),
            y: Math.max(-pad, Math.min(h + pad, b.position.y)),
          })
          Body.setVelocity(b, { x: 0, y: 0 })
        }
      }

      setPositions(bodies.map(b => ({
        x: b.position.x,
        y: b.position.y,
        angle: b.angle,
      })))

      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafRef.current)
      World.clear(engine.world)
      Engine.clear(engine)
    }
  }, [])

  return (
    <div className="me-page" ref={containerRef}>
      <div className="me-texture" />

      {BADGES.map((badge, i) => {
        const pos = positions[i]
        if (!pos) return null
        const size = badge.r * 2
        return (
          <div key={badge.id}>
            <div
              className={`badge${dragIdx === i ? ' grabbed' : ''}${badge.isLogo ? ' badge-logo' : ''}`}
              style={{
                left: pos.x - badge.r,
                top: pos.y - badge.r,
                width: size,
                height: size,
              }}
            >
              <img
                className="badge-img"
                src={badge.img}
                alt={badge.label}
                draggable={false}
                style={{ width: size, height: size }}
              />
            </div>
            {badge.sub && (
              <span
                className="badge-sub"
                style={{
                  left: pos.x - badge.r,
                  top: pos.y + badge.r + 8,
                  width: size,
                }}
              >
                {badge.sub}
              </span>
            )}
          </div>
        )
      })}

      <a href="/" className="back-arrow">&larr;</a>
      <div className="me-bio">
        <h1 className="me-title">About me</h1>
        <p className="me-text">
          I'm Andres Sol — ever since I was a child I knew that I wanted to be inside looking at the computer.
          From full-stack web apps to marine research tools.
          Trading bots to security exploits, I chase problems that make me think. 
          I build what I need, and I use what I build. <a href="/projects" className="me-link">Here is some of it.</a>
        </p>
        <p className="me-text me-text-dim">
          Drag the badges around — they're more fun that way.
        </p>
      </div>
    </div>
  )
}

export default Me
