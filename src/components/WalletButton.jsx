function truncateAddress(addr) {
  if (!addr) return ''
  return addr.slice(0, 4) + '…' + addr.slice(-4)
}

function formatBalance(bal) {
  if (bal === null || bal === undefined) return '—'
  const num = parseFloat(bal)
  if (num < 0.01 && num > 0) return '0.0' + num.toFixed(4).replace(/0+$/, '')
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WalletButton({ wallet }) {
  const { address, balance, loading, connect, disconnect } = wallet

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-0 rounded-full bg-[var(--nova-surface-solid)] border border-[var(--nova-border)] hover:border-purple-400/40 transition-all duration-200 cursor-pointer group"
      >
        <span className="pl-3.5 pr-2 py-1.5 text-[13px] font-medium text-[var(--nova-text-bright)] whitespace-nowrap">
          {formatBalance(balance)} <span className="text-purple-300/60 text-xs">XLM</span>
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/20 group-hover:bg-purple-500/25 transition-colors">
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="text-[12px] font-mono text-purple-200/80">
            {truncateAddress(address)}
          </span>
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="group px-5 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
    >
      {loading ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
