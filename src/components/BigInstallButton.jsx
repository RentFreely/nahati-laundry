import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaAndroid, FaApple, FaDownload } from 'react-icons/fa6'
import { usePWAInstall } from '../hooks/usePWAInstall'

export default function BigInstallButton({ className = '' }) {
  const navigate = useNavigate()
  const { canInstall, install, isInstalled, isIOS, isAndroid } = usePWAInstall()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      if (isInstalled) {
        navigate('/')
        return
      }
      if (canInstall) {
        const choice = await install()
        if (choice?.outcome === 'accepted') return
      }
      if (isIOS || isAndroid || !canInstall) {
        navigate('/install/iphone')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const Icon = isInstalled ? FaDownload : isIOS ? FaApple : isAndroid ? FaAndroid : FaDownload
  const label = isInstalled ? 'Open App' : isIOS ? 'Add to Home Screen' : canInstall || isAndroid ? 'Install App' : 'Get App'

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-emerald-500 text-white px-5 py-3 shadow-lg hover:shadow-xl active:scale-[0.99] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
      <span className="font-semibold tracking-wide">{label}</span>
    </button>
  )
}
