import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useWebHaptics } from 'web-haptics/react'
import './Projects.css'

const BATCH = 15
const EASE = 'cubic-bezier(0.87, 0, 0.13, 1)'


function Projects() {
  const [repos, setRepos] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [shown, setShown] = useState(BATCH)
  const { trigger } = useWebHaptics({ debug: true })
  const { soudnless_trigger } = useWebHaptics({debug: false})
  const gridRef = useRef(null)
  const positionsRef = useRef(new Map())
  const animationsRef = useRef(new Map())

  useEffect(() => {
    fetch('https://api.github.com/users/TheOneWhoBurns/repos?sort=updated&per_page=100')
      .then((res) => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setRepos(data.filter((r) => !r.fork))
      })
      .catch(() => {})
  }, [])

  const tags = [...new Set(
    repos.flatMap((r) => [
      r.language,
      ...r.topics,
    ].filter(Boolean))
  )].sort()

  const matches = (repo) => {
    if (!selectedTag) return true
    return repo.language === selectedTag || repo.topics.includes(selectedTag)
  }

  const visible = repos.slice(0, shown)
  const hasMore = shown < repos.length

  const capturePositions = () => {
    const grid = gridRef.current
    if (!grid) return
    positionsRef.current.clear()
    for (const card of grid.children) {
      if (card.classList.contains('hidden')) continue
      const rect = card.getBoundingClientRect()
      positionsRef.current.set(card.dataset.id, { x: rect.left, y: rect.top })
    }
  }

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || positionsRef.current.size === 0) return

    const reads = []
    for (const card of grid.children) {
      if (card.classList.contains('hidden')) continue
      const id = card.dataset.id
      const oldPos = positionsRef.current.get(id)
      if (!oldPos) continue
      const rect = card.getBoundingClientRect()
      const dx = oldPos.x - rect.left
      const dy = oldPos.y - rect.top
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        reads.push({ card, dx, dy, id })
      }
    }

    for (const { card, dx, dy, id } of reads) {
      const prev = animationsRef.current.get(id)
      if (prev) prev.cancel()

      const anim = card.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 400, easing: EASE }
      )
      animationsRef.current.set(id, anim)
      anim.onfinish = () => animationsRef.current.delete(id)
    }

    positionsRef.current.clear()
  }, [selectedTag])

  const selectTag = (tag) => {
    capturePositions()
    setSelectedTag(selectedTag === tag ? null : tag)
    setShown(repos.length)
    trigger('medium')
  }

  return (
    <div className="projects-page">
      <div className="texture-overlay projects-texture" />
      <a href="/" className="back-arrow">&larr;</a>
      <h1 className="projects-title">Projects</h1>
      <div className={`tags-container${tagsExpanded ? ' expanded' : ''}`}>
        <div className="tags">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`tag${selectedTag === tag ? ' active' : ''}`}
              onClick={() => selectTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {!tagsExpanded && (
          <div className="tags-expand-zone" onClick={() => { setTagsExpanded(true); soudnless_trigger('success') }} />
        )}
      </div>
      <button className="tags-toggle" onClick={() => { setTagsExpanded(!tagsExpanded); soudnless_trigger('success') }}>
        {tagsExpanded ? 'see less' : 'see more'}
      </button>
      <hr className="projects-divider" />
      <div className="projects-grid" ref={gridRef}>
        {visible.map((repo, i) => (
          <a
            key={repo.id}
            data-id={String(repo.id)}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`project-card${matches(repo) ? '' : ' hidden'}`}
            style={{ '--i': i }}
            onClick={() => trigger('medium')}
          >
            {repo.language && <span className="card-lang">{repo.language}</span>}
            <span className="card-name">{repo.name}</span>
            {repo.description && (
              <span className="card-desc">{repo.description}</span>
            )}
          </a>
        ))}
      </div>
      {hasMore && (
        <button className="load-more" onClick={() => { setShown((s) => s + BATCH); trigger('medium') }}>
          show more
        </button>
      )}
    </div>
  )
}

export default Projects
