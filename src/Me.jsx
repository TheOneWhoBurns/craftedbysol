import { useRef, useEffect, useState } from 'react'
import Matter from 'matter-js'
import { useWebHaptics } from 'web-haptics/react'
import usfqLogo from './assets/usfq-logo.svg'
import './Me.css'

const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events } = Matter

const BADGES = [
  { id: 1, label: 'AWS CloudOps Engineer', img: 'https://images.credly.com/size/340x340/images/88a6405e-0f26-442a-95ed-f9b9db4c857e/blob', r: 120 },
  { id: 2, label: 'AWS Cloud Practitioner', img: 'https://images.credly.com/size/340x340/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png', r: 120 },
  { id: 3, label: 'AWS Sales Accreditation', img: 'https://images.credly.com/size/340x340/images/46ea4542-72a8-46a1-8d68-b72c4ca50820/blob', r: 120 },
  { id: 4, label: 'AWS Technical Accredited', img: 'https://images.credly.com/size/340x340/images/8f006312-3154-45bf-a845-4a043641e83c/blob', r: 120 },
  { id: 5, label: 'USFQ', img: usfqLogo, isLogo: true, sub: 'Computer Science', r: 160 },
]

const USFQ_IDX = 4
const GRAVITY_STRENGTH = 0.0004

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
    const cx = w * 0.72
    const cy = h * 0.42

    const engine = Engine.create({ gravity: { x: 0, y: 0 } })
    engineRef.current = engine

    /* boundary walls — thick so nothing escapes */
    const t = 60
    const walls = [
      Bodies.rectangle(w / 2, -t / 2, w + 200, t, { isStatic: true }),         // top
      Bodies.rectangle(w / 2, h + t / 2, w + 200, t, { isStatic: true }),       // bottom
      Bodies.rectangle(-t / 2, h / 2, t, h + 200, { isStatic: true }),          // left
      Bodies.rectangle(w + t / 2, h / 2, t, h + 200, { isStatic: true }),       // right
    ]

    /* badge bodies — circles for clean collision */
    const startPositions = [
      { x: cx - 160, y: cy - 120 },
      { x: cx + 160, y: cy - 100 },
      { x: cx - 140, y: cy + 130 },
      { x: cx + 150, y: cy + 120 },
      { x: cx, y: cy },              // USFQ center
    ]

    const bodies = BADGES.map((badge, i) => {
      const body = Bodies.circle(startPositions[i].x, startPositions[i].y, badge.r, {
        restitution: 0.4,
        friction: 0.05,
        frictionAir: 0.04,
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
      constraint: { stiffness: 0.6, damping: 0.1, render: { visible: false } },
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
        /* let USFQ drift back to center then re-lock */
        setTimeout(() => Body.setStatic(e.body, true), 2000)
      }
      triggerRef.current('success')
    })

    /* physics loop */
    const step = () => {
      /* gravity: pull non-USFQ badges toward USFQ */
      const usfqPos = bodies[USFQ_IDX].position
      for (let i = 0; i < bodies.length; i++) {
        if (i === USFQ_IDX) continue
        const b = bodies[i]
        const dx = usfqPos.x - b.position.x
        const dy = usfqPos.y - b.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 1) {
          const force = GRAVITY_STRENGTH * b.mass
          Body.applyForce(b, b.position, {
            x: (dx / dist) * force,
            y: (dy / dist) * force,
          })
        }
      }

      Engine.update(engine, 1000 / 60)

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

      <div className="me-bio">
        <h1 className="me-title">About me</h1>
        <p className="me-text">
          I'm Sol — a developer who builds things that feel right.
          From full-stack web apps to trading bots, marine research tools
          to security exploits, I chase problems that make me think.
          I care about craft: clean architecture, honest interfaces,
          and code that doesn't waste anyone's time.
        </p>
        <p className="me-text me-text-dim">
          Drag the badges around — they're more fun that way.
        </p>
      </div>
    </div>
  )
}

export default Me
