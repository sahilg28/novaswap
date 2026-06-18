import { useWallet } from './hooks/useWallet'
import { useActivityFeed } from './hooks/useActivityFeed'
import Header from './components/Header'
import ErrorBanner from './components/ErrorBanner'
import SwapPanel from './components/SwapPanel'
import ActivityFeed from './components/ActivityFeed'
import Galaxy from './components/Galaxy'

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

      {/* App content — pointer-events-none on the wrapper, re-enabled on interactive children */}
      <div className="relative z-10 min-h-screen flex flex-col pointer-events-none">
        <Header wallet={wallet} />
        <ErrorBanner message={wallet.error} onDismiss={wallet.clearError} />

        <main className="flex-1 flex flex-col items-center pt-12 px-4 pb-12">
          {!wallet.address ? (
            <div className="text-center pt-16 pointer-events-auto">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-300 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
                Swap tokens on Stellar
              </h2>
              <p className="text-purple-300/40 text-sm">
                Connect your wallet to get started.
              </p>
            </div>
          ) : (
            <>
              <SwapPanel wallet={wallet} onSwapLogged={feed.refresh} />
              <ActivityFeed swaps={feed.swaps} loading={feed.loading} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
