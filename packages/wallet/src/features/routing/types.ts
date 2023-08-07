import { Token } from '@uniswap/sdk-core'
import { ChainId } from 'wallet/src/constants/chains'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'

// Routing API types
export enum RouterPreference {
  AUTO = 'auto',
  API = 'api',
  CLIENT = 'client',
}

export interface QuoteRequest {
  tokenInChainId: ChainId
  tokenIn: string
  tokenOutChainId: ChainId
  tokenOut: string
  amount: string
  type: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  configs: [
    {
      protocols: string[]
      routingType: 'CLASSIC'
      enableUniversalRouter: boolean
      recipient?: string
      slippageTolerance?: number
      deadline?: number
      simulateFromAddress?: string
      permitSignature?: string
      permitAmount?: string
      permitExpiration?: string
      permitSigDeadline?: string
      permitNonce?: string
    }
  ]
}

export type QuoteResponse = {
  routing: RouterPreference.API
  quote: QuoteResult
  timestamp: number // used as a cache ttl
}

export interface QuoteResult {
  quoteId?: string
  blockNumber: string
  amount: string
  amountDecimals: string
  gasPriceWei: string
  gasUseEstimate: string
  gasUseEstimateQuote: string
  gasUseEstimateQuoteDecimals: string
  gasUseEstimateUSD: string
  methodParameters?: { calldata: string; value: string }
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  route: Array<(V3PoolInRoute | V2PoolInRoute)[]>
  routeString: string
  simulationError?: boolean
}

export interface TradeQuoteResult {
  trade: Trade
  simulationError?: boolean
  gasUseEstimate: string
}

export type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>

export enum PoolType {
  V2Pool = 'v2-pool',
  V3Pool = 'v3-pool',
}

export type V3PoolInRoute = {
  type: PoolType.V3Pool
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  sqrtRatioX96: string
  liquidity: string
  tickCurrent: string
  fee: string
  amountIn?: string
  amountOut?: string

  // not used in the interface
  address?: string
}

export type V2Reserve = {
  token: TokenInRoute
  quotient: string
}

export type V2PoolInRoute = {
  type: PoolType.V2Pool
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  reserve0: V2Reserve
  reserve1: V2Reserve
  amountIn?: string
  amountOut?: string

  // no used in the interface
  // avoid returning it from the client-side smart-order-router
  address?: string
}

// End Routing API types
