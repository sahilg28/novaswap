import { useState, useEffect, useCallback, useRef } from 'react'
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter'
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull'
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo'
import { fetchXlmBalance } from '../lib/stellar'

let kitInitialized = false

function initKit() {
  if (kitInitialized) return
  StellarWalletsKit.init({
    modules: [new FreighterModule(), new xBullModule(), new AlbedoModule()],
    network: Networks.TESTNET,
  })
  kitInitialized = true
}

export function useWallet() {
  const [address, setAddress] = useState(null)
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const balanceInterval = useRef(null)

  useEffect(() => {
    initKit()
  }, [])

  const refreshBalance = useCallback(async (addr) => {
    if (!addr) return
    try {
      const bal = await fetchXlmBalance(addr)
      setBalance(bal)
    } catch {
      setBalance(null)
    }
  }, [])

  useEffect(() => {
    if (address) {
      refreshBalance(address)
      balanceInterval.current = setInterval(() => refreshBalance(address), 15000)
    }
    return () => {
      if (balanceInterval.current) clearInterval(balanceInterval.current)
    }
  }, [address, refreshBalance])

  const connect = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const { address: addr } = await StellarWalletsKit.authModal()
      setAddress(addr)
    } catch (err) {
      const msg = err?.message?.toLowerCase() || ''
      if (msg.includes('cancel') || msg.includes('reject') || msg.includes('denied') || msg.includes('closed')) {
        setError(null)
      } else if (msg.includes('not available') || msg.includes('not installed') || msg.includes('not found')) {
        setError('Wallet not found. Please install a Stellar wallet extension.')
      } else {
        setError('Could not connect wallet. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect()
    } catch {
      // some modules don't implement disconnect
    }
    setAddress(null)
    setBalance(null)
    setError(null)
    if (balanceInterval.current) clearInterval(balanceInterval.current)
  }, [])

  const signTransaction = useCallback(async (xdr) => {
    return StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
      address,
    })
  }, [address])

  return {
    address,
    balance,
    loading,
    error,
    connect,
    disconnect,
    signTransaction,
    clearError: () => setError(null),
  }
}
