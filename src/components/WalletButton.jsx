function truncateAddress(addr) {
  if (!addr) return ''
  return addr.slice(0, 4) + '…' + addr.slice(-4)
}

function formatBalance(bal) {
  if (bal === null || bal === undefined) return '—'
  const num = parseFloat(bal)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WalletButton({ wallet }) {
  const { address, balance, loading, connect, disconnect } = wallet

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[11px] font-mono text-purple-300/60 tracking-wide">
            {truncateAddress(address)}
          </div>
          <div className="text-sm font-semibold text-[var(--nova-text-bright)]">
            {formatBalance(balance)} <span className="text-purple-300/70 text-xs font-normal">XLM</span>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--nova-border)] text-purple-300/70 hover:text-[var(--nova-error)] hover:border-[var(--nova-error)]/30 hover:bg-[var(--nova-error)]/5 transition-all duration-200 cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="group px-5 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
    >
      {loading ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
