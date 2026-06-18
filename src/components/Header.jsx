import WalletButton from './WalletButton'

export default function Header({ wallet }) {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--nova-border)] bg-[var(--nova-bg)] backdrop-blur-xl pointer-events-auto">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" fill="url(#novaCore)"/>
            <g opacity="0.8">
              <line x1="12" y1="1" x2="12" y2="6" stroke="url(#novaRay)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="23" stroke="url(#novaRay)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="12" x2="6" y2="12" stroke="url(#novaRay)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="18" y1="12" x2="23" y2="12" stroke="url(#novaRay)" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
            <g opacity="0.5">
              <line x1="4.22" y1="4.22" x2="7.76" y2="7.76" stroke="url(#novaRay)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="16.24" y1="16.24" x2="19.78" y2="19.78" stroke="url(#novaRay)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="4.22" y1="19.78" x2="7.76" y2="16.24" stroke="url(#novaRay)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="16.24" y1="7.76" x2="19.78" y2="4.22" stroke="url(#novaRay)" strokeWidth="1.2" strokeLinecap="round"/>
            </g>
            <circle cx="12" cy="12" r="6" stroke="url(#novaRay)" strokeWidth="0.5" opacity="0.3"/>
            <defs>
              <radialGradient id="novaCore" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#e9d5ff"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </radialGradient>
              <linearGradient id="novaRay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
          <h1 className="text-lg font-bold tracking-tight text-[var(--nova-text-bright)]" style={{ fontFamily: "'Geist', sans-serif" }}>
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">
              Nova
            </span>
            <span className="text-[var(--nova-text-bright)]">Swap</span>
          </h1>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Testnet
        </span>
      </div>
      <WalletButton wallet={wallet} />
    </header>
  )
}
