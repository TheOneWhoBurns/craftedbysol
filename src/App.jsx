import { useState, useEffect } from 'react'
import { TextMorph } from 'torph/react'
import './App.css'

const names = ['Sol', 'Andres\u00A0Martinez', 'TheOneWhoBurns']
const TYPE_SPEED = 80
const DELETE_SPEED = 60
const PAUSE_BEFORE_DELETE = 2000
const PAUSE_BEFORE_TYPE = 400

function useTypewriter(strings) {
  const [displayed, setDisplayed] = useState(strings[0])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const current = strings[index]
    const next = strings[(index + 1) % strings.length]
    const timers = { timeout: null, deleteInterval: null, pauseTimeout: null, typeInterval: null }

    timers.timeout = setTimeout(() => {
      let i = current.length
      timers.deleteInterval = setInterval(() => {
        i--
        if (i > 0) {
          setDisplayed(current.slice(0, i))
        } else {
          clearInterval(timers.deleteInterval)
          setDisplayed('\u200B')
          timers.pauseTimeout = setTimeout(() => {
            let j = 0
            timers.typeInterval = setInterval(() => {
              j++
              setDisplayed(next.slice(0, j))
              if (j >= next.length) {
                clearInterval(timers.typeInterval)
                setIndex((prev) => (prev + 1) % strings.length)
              }
            }, TYPE_SPEED)
          }, PAUSE_BEFORE_TYPE)
        }
      }, DELETE_SPEED)
    }, PAUSE_BEFORE_DELETE)

    return () => {
      clearTimeout(timers.timeout)
      clearInterval(timers.deleteInterval)
      clearTimeout(timers.pauseTimeout)
      clearInterval(timers.typeInterval)
    }
  }, [index, strings])

  return displayed
}

function App() {
  const name = useTypewriter(names)

  return (
    <div className="page">
      <div className="texture-overlay" />
      <a href="https://projects.craftedbysol.dev" className="nav-link">Projects</a>
      <div className="name">
        <span className="static">Crafted by&nbsp;</span>
        <a href="https://github.com/TheOneWhoBurns" target="_blank" rel="noopener noreferrer" className="morph-link">
          <TextMorph className="morph" duration={80} scale={false} ease="linear">{name}</TextMorph>
        </a>
      </div>
    </div>
  )
}

export default App
