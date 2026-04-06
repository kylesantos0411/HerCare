import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ShowcaseApp } from './pages/ShowcaseApp.tsx'
import { getShowcaseScreen, seedShowcaseData } from './utils/showcase.ts'

const showcaseScreen = getShowcaseScreen()

if (showcaseScreen) {
  seedShowcaseData()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showcaseScreen ? <ShowcaseApp screen={showcaseScreen} /> : <App />}
  </StrictMode>,
)
