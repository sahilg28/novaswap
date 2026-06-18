import * as StellarSdk from '@stellar/stellar-sdk'
import { HORIZON_URL } from './constants'

const server = new StellarSdk.Horizon.Server(HORIZON_URL)

export function getServer() {
  return server
}

export async function fetchXlmBalance(address) {
  const account = await server.loadAccount(address)
  const native = account.balances.find(b => b.asset_type === 'native')
  return native ? native.balance : '0'
}

export async function fetchBalances(address) {
  const account = await server.loadAccount(address)
  const native = account.balances.find(b => b.asset_type === 'native')
  const usdc = account.balances.find(
    b => b.asset_code === 'USDC' && b.asset_type === 'credit_alphanum4'
  )
  return {
    XLM: native ? native.balance : '0',
    USDC: usdc ? usdc.balance : '0',
  }
}
