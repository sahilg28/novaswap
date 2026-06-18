import { EXPLORER_URL } from '../lib/constants'

export default function TxStatus({ status, onReset }) {
  if (!status) return null

  if (status.state === 'pending') {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-purple-300/80">
            {status.message || 'Processing swap…'}
          </span>
        </div>
      </div>
    )
  }

  if (status.state === 'success') {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
          <span className="text-sm font-medium text-emerald-400">Swap successful</span>
        </div>
        {status.hash && (
          <a
            href={`${EXPLORER_URL}/tx/${status.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-purple-400/70 hover:text-purple-300 transition-colors font-mono break-all"
          >
            View on Stellar Expert →
          </a>
        )}
        <div className="mt-3">
          <button
            onClick={onReset}
            className="text-[11px] text-purple-300/40 hover:text-purple-300/70 transition-colors cursor-pointer"
          >
            New swap
          </button>
        </div>
      </div>
    )
  }

  if (status.state === 'error') {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs">✗</span>
          <span className="text-sm font-medium text-red-400">Swap failed</span>
        </div>
        <p className="text-[11px] text-red-300/60 ml-7">{status.message}</p>
        <div className="mt-3">
          <button
            onClick={onReset}
            className="text-[11px] text-purple-300/40 hover:text-purple-300/70 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return null
}
