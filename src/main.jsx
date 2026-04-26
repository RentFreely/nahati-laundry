import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import Toast from './components/Toast'

// Register service worker for PWA
let updateSWFn = null
function PWAUpdater() {
  const [show, setShow] = useState(false)
  const [needRefresh, setNeedRefresh] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Mark installed when running in standalone (iOS/Android) or when the install event fires
    const markInstalled = () => {
      try { localStorage.setItem('nahati_installed', '1') } catch {}
    }
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = typeof navigator !== 'undefined' && 'standalone' in navigator && navigator.standalone
    if (isStandalone || isIOSStandalone) markInstalled()
    window.addEventListener('appinstalled', markInstalled)
  const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true)
        setShow(true)
        window.dispatchEvent(new Event('pwa:need-refresh'))
      },
      onOfflineReady() {
        // Optional: could show a one-time toast like "App ready for offline use"
      },
    })
    updateSWFn = updateSW
  return () => window.removeEventListener('appinstalled', markInstalled)
  }, [])

  const doRefresh = () => {
    setShow(false)
    if (updateSWFn) updateSWFn(true) // will reload the page with the new SW
  }

  return (
    <Toast
      show={show && needRefresh}
      message="A new update is available. Refresh to get the latest."
      actions={[{ label: 'Refresh', onClick: doRefresh }]}
      onClose={() => setShow(false)}
    />
  )
}

const baseUrl = import.meta.env.BASE_URL
const routerBasename =
  baseUrl === '/' || baseUrl === './' ? undefined : baseUrl.replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <PWAUpdater />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
