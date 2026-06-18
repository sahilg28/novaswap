import { useState, useEffect, useCallback, useRef } from 'react'
import { getRecentSwaps, fetchSwapEvents, getContractId } from '../lib/contract'

export function useActivityFeed() {
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(false)
  const latestLedgerRef = useRef(null)
  const pollRef = useRef(null)

  const loadInitial = useCallback(async () => {
    if (!getContractId()) return
    setLoading(true)
    try {
      const entries = await getRecentSwaps()
      setSwaps(entries.reverse())
    } catch {
      // contract may not have any entries yet
    } finally {
      setLoading(false)
    }
  }, [])

  const pollEvents = useCallback(async () => {
    if (!getContractId()) return
    try {
      const { events, latestLedger } = await fetchSwapEvents(
        latestLedgerRef.current
      )
      if (latestLedger) {
        latestLedgerRef.current = latestLedger
      }
      if (events.length > 0) {
        setSwaps(prev => {
          const merged = [...events.reverse(), ...prev]
          return merged.slice(0, 20)
        })
      }
    } catch {
      // polling failure is non-fatal
    }
  }, [])

  useEffect(() => {
    loadInitial()
    pollRef.current = setInterval(pollEvents, 10000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadInitial, pollEvents])

  const refresh = useCallback(async () => {
    await loadInitial()
  }, [loadInitial])

  return { swaps, loading, refresh }
}
