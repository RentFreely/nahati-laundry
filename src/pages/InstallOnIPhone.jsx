import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SpotlightSurface from '../components/SpotlightSurface'
import { usePWAInstall } from '../hooks/usePWAInstall'

export default function InstallOnIPhone() {
  const { isIOS, isAndroid } = usePWAInstall()

  const title = isAndroid ? 'Install on Android' : 'Install on iPhone'
  const intro = isAndroid
    ? 'If the Install prompt is not showing, you can still install Nahati from Chrome in two taps.'
    : 'Apple does not show an install banner like Android. Add Nahati to your Home Screen once and it opens like an app.'

  return (
    <div className="container-max py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-dark">PWA</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{intro}</p>
      </motion.div>

      <SpotlightSurface className="card mt-8 max-w-2xl rounded-2xl">
        <div className="relative z-[1]">
          {isAndroid ? (
            <>
              <ol className="list-decimal space-y-3 pl-5 text-slate-700">
                <li>Open this site in Chrome on Android.</li>
                <li>Tap the menu (three dots) in the top-right corner.</li>
                <li>Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;.</li>
                <li>Confirm install. The Nahati icon appears on your Home Screen.</li>
              </ol>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Tip: if opened from WhatsApp, Facebook, or Instagram, first tap &quot;Open in Chrome&quot; then install.
              </p>
            </>
          ) : (
            <>
              <ol className="list-decimal space-y-3 pl-5 text-slate-700">
                <li>Open this site in Safari on your iPhone (not another in-app browser).</li>
                <li>Tap the Share button (square with an arrow pointing up).</li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;.</li>
                <li>Tap &quot;Add&quot;. The Nahati icon appears on your Home Screen.</li>
              </ol>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Tip: if you do not see &quot;Add to Home Screen&quot;, scroll further in the Share sheet or tap &quot;Edit Actions&quot; to enable it.
              </p>
            </>
          )}
          <Link to="/" className="btn-outline mt-6 inline-flex">
            Back to home
          </Link>
        </div>
      </SpotlightSurface>
    </div>
  )
}
