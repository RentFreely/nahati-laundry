import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePWAInstall } from '../hooks/usePWAInstall'
import PublicImage from './PublicImage'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { canInstall, install } = usePWAInstall()
  const { user, supabaseConfigured } = useAuth()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }) =>
    `nav-link-glow px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      isActive ? 'text-brand is-active' : 'text-slate-600 hover:text-ink-900'
    }`

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
      <motion.nav
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="container-max flex items-center justify-between py-3.5"
      >
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative">
            <span className="absolute -inset-1 rounded-xl bg-gradient-to-br from-brand/30 to-sky-400/20 opacity-0 blur-md transition group-hover:opacity-100" />
            <PublicImage
              path="nahati_logo.png"
              alt="Nahati Anytime Laundry"
              priority
              className="relative h-10 w-10 rounded-xl bg-white object-contain p-0.5 ring-1 ring-slate-200/80 shadow-sm"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold tracking-tight text-ink-900 sm:text-lg">
              Nahati Anytime Laundry
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-brand-dark sm:inline">
              24/7 · Kampala
            </span>
          </span>
        </Link>
        <button
          type="button"
          className="rounded-xl p-2.5 text-ink-900 transition hover:bg-slate-100 sm:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/services" className={navLinkClass}>
            Services
          </NavLink>
          <NavLink to="/booking" className={navLinkClass}>
            Booking
          </NavLink>
          <NavLink to="/learn" className={navLinkClass}>
            Learn
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
          {supabaseConfigured ? (
            <NavLink to={user ? '/ops' : '/ops/login'} className={navLinkClass}>
              Ops
            </NavLink>
          ) : null}
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink-900"
            >
              Install
            </button>
          )}
          <Link to="/booking" className="btn-primary ml-2 text-sm">
            Book pickup
          </Link>
        </div>
      </motion.nav>
      {open && (
        <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur-xl sm:hidden">
          <div className="container-max flex flex-col gap-0.5 py-3">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/services" className={navLinkClass}>
              Services
            </NavLink>
            <NavLink to="/booking" className={navLinkClass}>
              Booking
            </NavLink>
            <NavLink to="/learn" className={navLinkClass}>
              Learn
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
            {supabaseConfigured ? (
              <NavLink to={user ? '/ops' : '/ops/login'} className={navLinkClass}>
                Ops
              </NavLink>
            ) : null}
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="mt-1 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink-900"
              >
                Install
              </button>
            )}
            <Link to="/booking" className="btn-primary mt-3 text-center text-sm">
              Book pickup
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
