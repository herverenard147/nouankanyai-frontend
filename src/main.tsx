import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/index.css'
import App from '@/App'
import { reloadForNewVersion } from '@/lib/newVersion'

// Fichier d'une ancienne version introuvable après une mise en ligne : on recharge une fois.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
