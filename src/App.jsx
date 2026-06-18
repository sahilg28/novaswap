import { useWallet } from './hooks/useWallet'
import { useActivityFeed } from './hooks/useActivityFeed'
import Header from './components/Header'
import ErrorBanner from './components/ErrorBanner'
import SwapPanel from './components/SwapPanel'
import ActivityFeed from './components/ActivityFeed'
import Footer from './components/Footer'
import Galaxy from './components/Galaxy'

function HowItWorks() {
  const steps = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      title: 'Connect',
      desc: 'Link your Stellar wallet',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10l5 5 5-5"/>
          <path d="M17 14l-5-5-5 5"/>
        </svg>
      ),
      title: 'Swap',
      desc: 'Trade on Stellar DEX',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <path d="M22 4L12 14.01l-3-3"/>
        </svg>
      ),
      title: 'Done',
      desc: 'Settled on-chain instantly',
    },
  ]

  return (
    <div className="mt-12 flex items-center justify-center gap-4 pointer-events-auto nova-fade-in-delay-2">
      {steps.map((step, i) => (
        <div key={step.title} className="flex items-center gap-4">
          <div className="flex flex-col items-center text-center w-28">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400/70 mb-2.5">
              {step.icon}
            </div>
            <span className="text-sm font-semibold text-[var(--nova-text-bright)] mb-0.5">{step.title}</span>
            <span className="text-[11px] text-purple-300/40">{step.desc}</span>
          </div>
          {i < steps.length - 1 && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-purple-500/25 -mt-6">
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const wallet = useWallet()
  const feed = useActivityFeed()

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Galaxy background */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <Galaxy
          transparent={false}
          density={1.2}
          speed={0.6}
          glowIntensity={0.4}
          saturation={0.6}
          hueShift={240}
          twinkleIntensity={0.4}
          rotationSpeed={0.05}
          mouseRepulsion={true}
          mouseInteraction={true}
          repulsionStrength={2}
        />
      </div>

      {/* App content */}
      <div className="relative z-10 min-h-screen flex flex-col pointer-events-none">
        <Header wallet={wallet} />
        <ErrorBanner message={wallet.error} onDismiss={wallet.clearError} />

        <main className="flex-1 flex flex-col items-center pt-12 px-4 pb-6">
          {!wallet.address ? (
            <>
              <div className="text-center pt-16 pointer-events-auto nova-fade-in">
                <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-300 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
                  Swap tokens on Stellar
                </h2>
                <p className="text-purple-300/40 text-sm nova-fade-in-delay-1">
                  Instant. Decentralized. On-chain.
                </p>
              </div>
              <HowItWorks />
            </>
          ) : (
            <>
              <SwapPanel wallet={wallet} onSwapLogged={feed.refresh} />
              <ActivityFeed swaps={feed.swaps} loading={feed.loading} />
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
