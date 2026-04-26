import { Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingButtons from './components/FloatingButtons'
import CursorAura from './components/CursorAura'
import Home from './pages/Home'
import Services from './pages/Services'
import Booking from './pages/Booking'
import Learn from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Contact from './pages/Contact'
import AdminInvoice from './pages/AdminInvoice'
import InstallOnIPhone from './pages/InstallOnIPhone'
import OpsGate from './components/OpsGate'
import RequireManager from './components/RequireManager'
import OpsLogin from './pages/ops/OpsLogin'
import OpsDashboard from './pages/ops/OpsDashboard'
import OpsOrders from './pages/ops/OpsOrders'
import OpsLedger from './pages/ops/OpsLedger'
import OpsInvoice from './pages/ops/OpsInvoice'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
}

function PageWrapper({ children }) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[70vh]"
    >
      {children}
    </motion.main>
  )
}

export default function App() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <CursorAura />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <Home />
                  </PageWrapper>
                }
              />
              <Route
                path="/services"
                element={
                  <PageWrapper>
                    <Services />
                  </PageWrapper>
                }
              />
              <Route
                path="/booking"
                element={
                  <PageWrapper>
                    <Booking />
                  </PageWrapper>
                }
              />
              <Route
                path="/learn"
                element={
                  <PageWrapper>
                    <Learn />
                  </PageWrapper>
                }
              />
              <Route
                path="/learn/:id"
                element={
                  <PageWrapper>
                    <BlogDetail />
                  </PageWrapper>
                }
              />
              <Route
                path="/contact"
                element={
                  <PageWrapper>
                    <Contact />
                  </PageWrapper>
                }
              />
              <Route
                path="/install/iphone"
                element={
                  <PageWrapper>
                    <InstallOnIPhone />
                  </PageWrapper>
                }
              />
              <Route
                path="/ops/login"
                element={
                  <PageWrapper>
                    <OpsLogin />
                  </PageWrapper>
                }
              />
              <Route
                path="/ops"
                element={
                  <PageWrapper>
                    <OpsGate />
                  </PageWrapper>
                }
              >
                <Route index element={<OpsDashboard />} />
                <Route path="orders" element={<OpsOrders />} />
                <Route path="invoice" element={<OpsInvoice />} />
                <Route
                  path="ledger"
                  element={
                    <RequireManager>
                      <OpsLedger />
                    </RequireManager>
                  }
                />
              </Route>
              <Route
                path="/admin/invoice"
                element={
                  <PageWrapper>
                    <AdminInvoice />
                  </PageWrapper>
                }
              />
              <Route
                path="*"
                element={
                  <PageWrapper>
                    <Home />
                  </PageWrapper>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
        <Footer />
        <FloatingButtons />
      </div>
    </div>
  )
}
