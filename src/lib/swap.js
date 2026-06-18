import * as StellarSdk from '@stellar/stellar-sdk'
import { getServer } from './stellar'
import { getAssetByCode } from './assets'
import { NETWORK_PASSPHRASE } from './constants'

export class SwapError extends Error {
  constructor(message, type, details) {
    super(message)
    this.type = type
    this.details = details
  }
}

export async function ensureTrustline(address, assetCode) {
  if (assetCode === 'XLM') return true

  const server = getServer()
  const account = await server.loadAccount(address)
  const assetDef = getAssetByCode(assetCode)

  const hasTrust = account.balances.some(
    b => b.asset_code === assetDef.code && b.asset_issuer === assetDef.issuer
  )

  return hasTrust
}

export function buildTrustlineTx(account, assetCode) {
  const assetDef = getAssetByCode(assetCode)
  return new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: assetDef.asset,
      })
    )
    .setTimeout(60)
    .build()
}

export function buildSwapTx(account, fromCode, toCode, amount, minOutput) {
  const from = getAssetByCode(fromCode)
  const to = getAssetByCode(toCode)

  // 1% slippage tolerance on the estimated output
  const destMin = (minOutput * 0.99).toFixed(7)

  return new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: from.asset,
        sendAmount: parseFloat(amount).toFixed(7),
        destination: account.accountId(),
        destAsset: to.asset,
        destMin,
        path: [],
      })
    )
    .setTimeout(60)
    .build()
}

export async function executeSwap({ address, fromCode, toCode, amount, estimatedOutput, signTransaction }) {
  const server = getServer()

  // 1. Check balance
  const account = await server.loadAccount(address)

  if (fromCode === 'XLM') {
    const native = account.balances.find(b => b.asset_type === 'native')
    const available = parseFloat(native?.balance || '0') - 1.5 // keep reserve
    if (available < parseFloat(amount)) {
      throw new SwapError(
        'Insufficient XLM balance. You need to keep at least 1.5 XLM as a network reserve.',
        'insufficient_balance'
      )
    }
  } else {
    const from = getAssetByCode(fromCode)
    const bal = account.balances.find(
      b => b.asset_code === from.code && b.asset_issuer === from.issuer
    )
    if (!bal || parseFloat(bal.balance) < parseFloat(amount)) {
      throw new SwapError(
        `Insufficient ${fromCode} balance.`,
        'insufficient_balance'
      )
    }
  }

  // 2. Ensure trustline for receiving asset
  if (toCode !== 'XLM') {
    const hasTrust = await ensureTrustline(address, toCode)
    if (!hasTrust) {
      const trustTx = buildTrustlineTx(account, toCode)
      const xdr = trustTx.toXDR()
      let signedTrust
      try {
        signedTrust = await signTransaction(xdr)
      } catch (err) {
        throw classifyWalletError(err, `You need a ${toCode} trustline to receive this asset. The trustline transaction was rejected.`)
      }
      const signedTrustTx = StellarSdk.TransactionBuilder.fromXDR(
        signedTrust.signedTxXdr,
        NETWORK_PASSPHRASE
      )
      await server.submitTransaction(signedTrustTx)
      // Re-load account since sequence number changed
      const freshAccount = await server.loadAccount(address)
      Object.assign(account, freshAccount)
    }
  }

  // 3. Build and sign the swap
  const swapTx = buildSwapTx(account, fromCode, toCode, amount, estimatedOutput)
  const xdr = swapTx.toXDR()

  let signed
  try {
    signed = await signTransaction(xdr)
  } catch (err) {
    throw classifyWalletError(err, 'Swap transaction was rejected.')
  }

  // 4. Submit
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK_PASSPHRASE
  )

  try {
    const result = await server.submitTransaction(signedTx)
    return {
      status: 'success',
      hash: result.hash,
    }
  } catch (err) {
    const resultCodes = err?.response?.data?.extras?.result_codes
    const opCodes = resultCodes?.operations || []

    if (opCodes.includes('op_underfunded')) {
      throw new SwapError('Insufficient balance to complete this swap.', 'insufficient_balance')
    }
    if (opCodes.includes('op_too_few_offers') || opCodes.includes('op_cross_self')) {
      throw new SwapError('Not enough liquidity on the orderbook for this trade.', 'no_liquidity')
    }
    if (opCodes.includes('op_under_dest_min')) {
      throw new SwapError('Price moved too much since your quote. Please try again.', 'slippage')
    }

    throw new SwapError(
      'Transaction failed. Please try again.',
      'tx_failed',
      resultCodes
    )
  }
}

function classifyWalletError(err, fallbackMessage) {
  const msg = (err?.message || '').toLowerCase()
  if (
    msg.includes('cancel') ||
    msg.includes('reject') ||
    msg.includes('denied') ||
    msg.includes('declined') ||
    msg.includes('closed') ||
    msg.includes('user') ||
    err?.code === -4
  ) {
    return new SwapError('Transaction was cancelled.', 'user_rejected')
  }
  if (msg.includes('not available') || msg.includes('not installed') || msg.includes('not found')) {
    return new SwapError('Wallet not found. Please install a Stellar wallet extension.', 'wallet_not_found')
  }
  return new SwapError(fallbackMessage || 'Wallet error. Please try again.', 'wallet_error')
}
