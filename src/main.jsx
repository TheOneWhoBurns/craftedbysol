import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const path = window.location.pathname
const isProjects = path.startsWith('/projects')
const isMe = path.startsWith('/me')

const ProjectsPage = lazy(() => import('./Projects.jsx'))
const MePage = lazy(() => import('./Me.jsx'))
const AppPage = lazy(() => import('./App.jsx'))

const Page = isProjects ? ProjectsPage : isMe ? MePage : AppPage

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)
