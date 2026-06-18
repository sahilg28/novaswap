import WalletButton from './WalletButton'

export default function Header({ wallet }) {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--nova-border)] bg-[var(--nova-bg)] backdrop-blur-xl pointer-events-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight text-[var(--nova-text-bright)]" style={{ fontFamily: "'Geist', sans-serif" }}>
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">
            Nova
          </span>
          <span className="text-[var(--nova-text-bright)]">Swap</span>
        </h1>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Testnet
        </span>
      </div>
      <WalletButton wallet={wallet} />
    </header>
  )
}
