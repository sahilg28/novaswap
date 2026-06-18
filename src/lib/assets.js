import { Asset } from '@stellar/stellar-sdk'
import { USDC_CODE, USDC_ISSUER } from './constants'

export const XLM = Asset.native()
export const USDC = new Asset(USDC_CODE, USDC_ISSUER)

export const ASSETS = [
  { code: 'XLM', issuer: null, asset: XLM, icon: '✦' },
  { code: 'USDC', issuer: USDC_ISSUER, asset: USDC, icon: '$' },
]

export function getAssetByCode(code) {
  return ASSETS.find(a => a.code === code)
}
