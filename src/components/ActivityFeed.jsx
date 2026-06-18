function truncateAddress(addr) {
  if (!addr) return '???'
  return addr.slice(0, 4) + '…' + addr.slice(-4)
}

function formatTime(ts) {
  if (!ts) return ''
  const date = new Date(ts * 1000)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}

export default function ActivityFeed({ swaps, loading }) {
  return (
    <div className="w-full max-w-[440px] mx-auto mt-6">
      <div className="relative bg-[var(--nova-surface)] backdrop-blur-2xl border border-[var(--nova-border)] rounded-3xl p-6 pointer-events-auto"
           style={{ boxShadow: 'var(--nova-card-shadow)' }}>

        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-purple-500/5 via-transparent to-transparent -z-10 blur-sm" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--nova-text-bright)] tracking-tight">
            Recent Swaps
          </h2>
          {loading && (
            <span className="inline-block w-3 h-3 border-2 border-purple-400/50 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {swaps.length === 0 ? (
          <p className="text-sm text-purple-300/30 text-center py-6">
            No swaps recorded yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {swaps.map((swap, i) => (
              <div
                key={`${swap.timestamp}-${i}`}
                className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400/60 text-[11px] font-mono">
                    {truncateAddress(swap.user)}
                  </span>
                  <span className="text-purple-300/25 text-xs">swapped</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--nova-text-bright)] font-medium text-[13px]">
                    {swap.amount.toFixed(2)}
                  </span>
                  <span className="text-purple-300/50 text-[11px]">{swap.from_asset}</span>
                  <span className="text-purple-500/30 text-[10px]">→</span>
                  <span className="text-purple-300/50 text-[11px]">{swap.to_asset}</span>
                  <span className="text-purple-300/20 text-[10px] ml-1">
                    {formatTime(swap.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
