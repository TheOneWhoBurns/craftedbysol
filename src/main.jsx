import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const path = window.location.pathname
const isProjects = path.startsWith('/projects')
const isMe = path.startsWith('/me')

const Page = lazy(() =>
  isProjects ? import('./Projects.jsx') :
  isMe ? import('./Me.jsx') :
  import('./App.jsx')
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)
