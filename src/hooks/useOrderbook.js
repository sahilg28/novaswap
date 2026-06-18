import { useState, useEffect, useCallback, useRef } from 'react'
import { getServer } from '../lib/stellar'
import { getAssetByCode } from '../lib/assets'

export function useOrderbook(fromCode, toCode) {
  const [bids, setBids] = useState([])
  const [asks, setAsks] = useState([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  const fetchOrderbook = useCallback(async () => {
    const from = getAssetByCode(fromCode)
    const to = getAssetByCode(toCode)
    if (!from || !to || fromCode === toCode) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const ob = await getServer()
        .orderbook(from.asset, to.asset)
        .limit(20)
        .call()

      if (!controller.signal.aborted) {
        setBids(ob.bids)
        setAsks(ob.asks)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setBids([])
        setAsks([])
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [fromCode, toCode])

  useEffect(() => {
    fetchOrderbook()
    const interval = setInterval(fetchOrderbook, 10000)
    return () => {
      clearInterval(interval)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [fetchOrderbook])

  return { bids, asks, loading, refresh: fetchOrderbook }
}

/**
 * Walk the orderbook to estimate how much `toAsset` you get for `amount` of `fromAsset`.
 * When selling fromAsset for toAsset, we consume the bids (people buying fromAsset).
 * The orderbook is base=fromAsset, quote=toAsset:
 *   - bids: buyers of fromAsset offering toAsset — price is toAsset per fromAsset
 *   - asks: sellers of fromAsset wanting toAsset — price is toAsset per fromAsset
 *
 * When user sells fromAsset → they hit the bids (someone is buying fromAsset at that price).
 * Each bid has price (toAsset/fromAsset) and amount (in fromAsset).
 */
export function estimateSwap(amount, bids) {
  if (!amount || amount <= 0 || !bids || bids.length === 0) {
    return { estimatedOutput: 0, rate: 0, sufficient: false }
  }

  let remaining = parseFloat(amount)
  let totalOutput = 0

  for (const bid of bids) {
    if (remaining <= 0) break

    const bidAmount = parseFloat(bid.amount)
    const bidPrice = parseFloat(bid.price)

    const filled = Math.min(remaining, bidAmount)
    totalOutput += filled * bidPrice
    remaining -= filled
  }

  const sufficient = remaining <= 0
  const rate = totalOutput / parseFloat(amount)

  return {
    estimatedOutput: totalOutput,
    rate,
    sufficient,
  }
}
