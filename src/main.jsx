import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const path = window.location.pathname
const host = window.location.hostname
const isProjects = host.startsWith('projects.') || path.startsWith('/projects')
const isMe = host.startsWith('me.') || path.startsWith('/me')
const Page = lazy(() => isProjects ? import('./Projects.jsx') : isMe ? import('./Me.jsx') : import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)
