import * as StellarSdk from '@stellar/stellar-sdk'
import { SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from './constants'

const DEFAULT_CONTRACT_ID = 'CC7BLI4HA6JABI5ABXYXEXCKAMWXNRL7F2GBVMSVRI6PNXO4ZBSALYQQ'
let CONTRACT_ID = localStorage.getItem('novaswap_contract_id') || DEFAULT_CONTRACT_ID

export function setContractId(id) {
  CONTRACT_ID = id
  localStorage.setItem('novaswap_contract_id', id)
}

export function getContractId() {
  return CONTRACT_ID
}

function getRpcServer() {
  return new StellarSdk.rpc.Server(SOROBAN_RPC_URL)
}

export async function recordSwap({ address, fromAsset, toAsset, amount, signTransaction }) {
  if (!CONTRACT_ID) return null

  const rpc = getRpcServer()
  const account = await rpc.getAccount(address)
  const contract = new StellarSdk.Contract(CONTRACT_ID)

  const timestamp = BigInt(Math.floor(Date.now() / 1000))
  // Amount in stroops (7 decimal places)
  const amountInt = BigInt(Math.round(parseFloat(amount) * 10_000_000))

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'record_swap',
        StellarSdk.nativeToScVal(address, { type: 'address' }),
        StellarSdk.nativeToScVal(fromAsset, { type: 'string' }),
        StellarSdk.nativeToScVal(toAsset, { type: 'string' }),
        StellarSdk.nativeToScVal(amountInt, { type: 'i128' }),
        StellarSdk.nativeToScVal(timestamp, { type: 'u64' }),
      )
    )
    .setTimeout(30)
    .build()

  const prepared = await rpc.prepareTransaction(tx)
  const xdr = prepared.toXDR()

  const { signedTxXdr } = await signTransaction(xdr)

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  )

  const response = await rpc.sendTransaction(signedTx)

  if (response.status === 'PENDING') {
    let result = await rpc.getTransaction(response.hash)
    while (result.status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 1500))
      result = await rpc.getTransaction(response.hash)
    }
    return result
  }

  return response
}

export async function getRecentSwaps() {
  if (!CONTRACT_ID) return []

  const rpc = getRpcServer()
  const contract = new StellarSdk.Contract(CONTRACT_ID)

  const tx = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
    { fee: StellarSdk.BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }
  )
    .addOperation(contract.call('get_recent_swaps'))
    .setTimeout(30)
    .build()

  const response = await rpc.simulateTransaction(tx)

  if (response.result) {
    return parseSwapEntries(response.result.retval)
  }

  return []
}

function parseSwapEntries(scVal) {
  try {
    const entries = StellarSdk.scValToNative(scVal)
    return entries.map(e => ({
      user: e.user?.toString() || e.user,
      from_asset: e.from_asset,
      to_asset: e.to_asset,
      amount: Number(e.amount) / 10_000_000,
      timestamp: Number(e.timestamp),
    }))
  } catch {
    return []
  }
}

export async function fetchSwapEvents(startLedger) {
  if (!CONTRACT_ID) return { events: [], latestLedger: startLedger }

  const rpc = getRpcServer()

  try {
    const response = await rpc.getEvents({
      startLedger: startLedger || undefined,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
          topics: [['AAAADgAAAARzd2Fw']],  // symbol "swap" as base64 ScVal
        },
      ],
      limit: 20,
    })

    const events = (response.events || []).map(ev => {
      try {
        const data = StellarSdk.scValToNative(ev.value)
        return {
          user: data[0]?.toString() || data[0],
          from_asset: data[1],
          to_asset: data[2],
          amount: Number(data[3]) / 10_000_000,
          timestamp: Number(data[4]),
          ledger: ev.ledger,
        }
      } catch {
        return null
      }
    }).filter(Boolean)

    return {
      events,
      latestLedger: response.latestLedger,
    }
  } catch {
    return { events: [], latestLedger: startLedger }
  }
}
