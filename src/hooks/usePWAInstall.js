import { useEffect, useState, useCallback } from 'react'

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState({ isIOS: false, isAndroid: false })

  useEffect(() => {
    const ua = navigator.userAgent || ''
    setPlatform({
      isIOS: /iphone|ipad|ipod/i.test(ua),
      isAndroid: /android/i.test(ua),
    })

    const standaloneMedia = window.matchMedia('(display-mode: standalone)')
    const computeInstalled = () => {
      const isStandalone = standaloneMedia.matches
      const isIOSStandalone = typeof navigator !== 'undefined' && 'standalone' in navigator && navigator.standalone
      const isStored = typeof localStorage !== 'undefined' && localStorage.getItem('nahati_installed') === '1'
      setIsInstalled(Boolean(isStandalone || isIOSStandalone || isStored))
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      try {
        localStorage.setItem('nahati_installed', '1')
      } catch {}
    }

    computeInstalled()
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onInstalled)
    standaloneMedia.addEventListener('change', computeInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
      standaloneMedia.removeEventListener('change', computeInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'dismissed' }
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
    return choice
  }, [deferredPrompt])

  return { canInstall, install, isInstalled, ...platform }
}

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)

  useEffect(() => {
    // Listen to custom events from main.jsx registration hooks if needed later
    const onNeedRefresh = () => setNeedRefresh(true)
    window.addEventListener('pwa:need-refresh', onNeedRefresh)
    return () => window.removeEventListener('pwa:need-refresh', onNeedRefresh)
  }, [])

  const reload = useCallback(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(() => window.location.reload())
  }, [])

  return { needRefresh, reload }
}
