import { useState, useMemo } from 'react'
import { ASSETS } from '../lib/assets'
import { useOrderbook, estimateSwap } from '../hooks/useOrderbook'
import { executeSwap } from '../lib/swap'
import { recordSwap, getContractId } from '../lib/contract'
import AssetSelector from './AssetSelector'
import TxStatus from './TxStatus'

export default function SwapPanel({ wallet, onSwapLogged }) {
  const [fromAsset, setFromAsset] = useState('XLM')
  const [toAsset, setToAsset] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [txStatus, setTxStatus] = useState(null)
  const [swapping, setSwapping] = useState(false)
  const [logging, setLogging] = useState(false)

  const { bids, asks, loading: obLoading } = useOrderbook(fromAsset, toAsset)

  const estimate = useMemo(() => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return null
    return estimateSwap(parsed, bids)
  }, [amount, bids])

  function handleFlip() {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
    setAmount('')
    setTxStatus(null)
  }

  function handleAmountChange(e) {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val)
      setTxStatus(null)
    }
  }

  function handleReset() {
    setAmount('')
    setTxStatus(null)
  }

  async function handleSwap() {
    if (swapping || !estimate?.sufficient) return

    const swapAmount = amount
    setSwapping(true)
    setTxStatus({ state: 'pending', message: 'Preparing transaction…' })

    try {
      setTxStatus({ state: 'pending', message: 'Please approve in your wallet…' })

      const result = await executeSwap({
        address: wallet.address,
        fromCode: fromAsset,
        toCode: toAsset,
        amount,
        estimatedOutput: estimate.estimatedOutput,
        signTransaction: wallet.signTransaction,
      })

      setTxStatus({
        state: 'success',
        hash: result.hash,
      })

      if (getContractId()) {
        setLogging(true)
        try {
          await recordSwap({
            address: wallet.address,
            fromAsset,
            toAsset,
            amount: swapAmount,
            signTransaction: wallet.signTransaction,
          })
          if (onSwapLogged) onSwapLogged()
        } catch {
          // User dismissed or contract call failed — swap is still successful
        } finally {
          setLogging(false)
        }
      }

      setAmount('')
    } catch (err) {
      if (err.type === 'user_rejected') {
        setTxStatus(null)
      } else {
        setTxStatus({
          state: 'error',
          message: err.message || 'Something went wrong. Please try again.',
          type: err.type,
        })
      }
    } finally {
      setSwapping(false)
    }
  }

  const canSwap = wallet.address
    && amount
    && parseFloat(amount) > 0
    && estimate?.sufficient
    && !swapping

  const buttonLabel = !wallet.address
    ? 'Connect Wallet'
    : !amount || parseFloat(amount) <= 0
      ? 'Enter an amount'
      : estimate && !estimate.sufficient
        ? 'Insufficient liquidity'
        : swapping
          ? 'Swapping…'
          : 'Swap'

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="relative bg-[var(--nova-surface)] backdrop-blur-2xl border border-[var(--nova-border)] rounded-3xl p-6 pointer-events-auto"
           style={{ boxShadow: 'var(--nova-card-shadow)' }}>

        {/* Subtle glow behind card */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-purple-500/10 via-transparent to-transparent -z-10 blur-sm" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--nova-text-bright)] tracking-tight">Swap</h2>
          {obLoading && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] text-purple-300/50 tracking-wide">LIVE</span>
            </div>
          )}
        </div>

        {/* From */}
        <div className="bg-[var(--nova-input-bg)] rounded-2xl p-4 mb-1.5 border border-white/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-purple-300/50 uppercase tracking-wider">You pay</span>
            {wallet.address && fromAsset === 'XLM' && wallet.balance && (
              <button
                onClick={() => {
                  const max = Math.max(0, parseFloat(wallet.balance) - 1.5)
                  setAmount(max.toFixed(7).replace(/\.?0+$/, ''))
                }}
                className="text-[11px] font-medium text-purple-400/70 hover:text-purple-300 transition-colors cursor-pointer"
              >
                Max: {parseFloat(wallet.balance).toFixed(2)}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={swapping}
              className="flex-1 bg-transparent text-[28px] font-semibold text-[var(--nova-text-bright)] outline-none placeholder:text-white/10 min-w-0 disabled:opacity-50"
            />
            <AssetSelector
              selected={fromAsset}
              other={toAsset}
              onChange={(v) => { setFromAsset(v); setTxStatus(null) }}
              disabled={swapping}
            />
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center -my-3.5 relative z-10">
          <button
            onClick={handleFlip}
            disabled={swapping}
            className="w-10 h-10 rounded-xl bg-[var(--nova-surface-solid)] border border-[var(--nova-border-glow)] flex items-center justify-center text-purple-300/60 hover:text-purple-200 hover:border-purple-400/40 hover:bg-purple-900/20 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2L8 14M8 2L5 5M8 2L11 5M8 14L5 11M8 14L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="bg-[var(--nova-input-bg)] rounded-2xl p-4 mt-1.5 border border-white/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-purple-300/50 uppercase tracking-wider">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-[28px] font-semibold text-[var(--nova-text-bright)] min-w-0 truncate">
              {estimate
                ? estimate.sufficient
                  ? estimate.estimatedOutput.toFixed(7).replace(/\.?0+$/, '')
                  : '—'
                : <span className="text-white/10">0.00</span>}
            </span>
            <AssetSelector
              selected={toAsset}
              other={fromAsset}
              onChange={(v) => { setToAsset(v); setTxStatus(null) }}
              disabled={swapping}
            />
          </div>
        </div>

        {/* Rate */}
        {estimate && estimate.sufficient && parseFloat(amount) > 0 && (
          <div className="mt-4 px-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300/40 uppercase tracking-wider">Rate</span>
              <span className="text-purple-200/60 font-mono">
                1 {fromAsset} ≈ {estimate.rate.toFixed(6)} {toAsset}
              </span>
            </div>
          </div>
        )}

        {estimate && !estimate.sufficient && parseFloat(amount) > 0 && (
          <div className="mt-4 px-1">
            <p className="text-[11px] text-amber-400/80">
              ⚠ Insufficient liquidity for this amount.
            </p>
          </div>
        )}

        {/* Swap button */}
        <button
          disabled={!canSwap}
          onClick={handleSwap}
          className="w-full mt-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer disabled:cursor-not-allowed text-white disabled:opacity-30"
          style={{
            background: canSwap
              ? 'linear-gradient(135deg, #9333ea, #7c3aed, #6d28d9)'
              : 'linear-gradient(135deg, #9333ea, #7c3aed, #6d28d9)',
            boxShadow: canSwap
              ? '0 0 24px rgba(147, 51, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
              : 'none',
          }}
        >
          {buttonLabel}
        </button>

        {/* Transaction status */}
        <TxStatus status={txStatus} onReset={handleReset} />

        {/* Non-blocking logging indicator */}
        {logging && (
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className="inline-block w-3 h-3 border-2 border-purple-400/50 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-purple-300/50">Logging swap on-chain…</span>
          </div>
        )}
      </div>
    </div>
  )
}
