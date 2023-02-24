import { TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { TransactionListQuery } from 'src/data/__generated__/types-and-hooks'
import { AssetType } from 'src/entities/assets'
import { MoonpayCurrency } from 'src/features/fiatOnRamp/types'
import { DappInfo } from 'src/features/walletConnect/types'

export type ChainIdToTxIdToDetails = ChainIdTo<{ [txId: string]: TransactionDetails }>

// Basic identifying info for a transaction
export interface TransactionId {
  chainId: ChainId
  id: string
}

export type TransactionListQueryResponse = NonNullable<
  NonNullable<NonNullable<TransactionListQuery['portfolios']>[0]>['assetActivities']
>[0]

export interface TransactionDetails extends TransactionId {
  from: Address

  // Specific info for the tx type
  typeInfo: TransactionTypeInfo

  // Info for status tracking
  status: TransactionStatus
  addedTime: number
  // Note: hash is mandatory for now but may be made optional if
  // we start tracking txs before they're actually sent
  hash: string

  // Info for submitting the tx
  options: TransactionOptions

  receipt?: TransactionReceipt

  isFlashbots?: boolean

  // cancelRequest is the txRequest object to be submitted
  // in attempt to cancel the current transaction
  // it should contain all the appropriate gas details in order
  // to get submitted first
  cancelRequest?: providers.TransactionRequest
}

export enum TransactionStatus {
  Cancelled = 'cancelled',
  Cancelling = 'cancelling',
  FailedCancel = 'failedCancel',
  Success = 'confirmed',
  Failed = 'failed',
  Pending = 'pending',
  Replacing = 'replacing',
  Unknown = 'unknown',
  // May want more granular options here later like InMemPool
}

// Transaction confirmed on chain
export type FinalizedTransactionStatus =
  | TransactionStatus.Success
  | TransactionStatus.Failed
  | TransactionStatus.Cancelled
  | TransactionStatus.FailedCancel

export interface FinalizedTransactionDetails extends TransactionDetails {
  status: FinalizedTransactionStatus
}

export interface TransactionOptions {
  request: providers.TransactionRequest
  timeoutMs?: number
}

export interface TransactionReceipt {
  transactionIndex: number
  blockHash: string
  blockNumber: number
  confirmedTime: number
  confirmations: number
}

export interface NFTSummaryInfo {
  tokenId: string
  name: string
  collectionName: string
  imageURL: string
}

export enum NFTTradeType {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Be careful adding to this enum, always assign a unique value (typescript will not prevent duplicate values).
 * These values are persisted in state and if you change the value it will cause errors
 */
export enum TransactionType {
  // Token Specific
  Approve = 'approve',
  Swap = 'swap',
  Wrap = 'wrap',

  // NFT specific
  NFTApprove = 'nft-approve',
  NFTTrade = 'nft-trade',
  NFTMint = 'nft-mint',

  // All asset types
  Send = 'send',
  Receive = 'receive',

  // Fiat onramp
  FiatPurchase = 'fiat-purchase',

  // General
  WCConfirm = 'wc-confirm',
  Unknown = 'unknown',
}

export interface BaseTransactionInfo {
  type: TransactionType
  transactedUSDValue?: number
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Approve
  tokenAddress: string
  spender: string
  approvalAmount?: string
}

interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Swap
  tradeType: TradeType
  inputCurrencyId: string
  outputCurrencyId: string
}

export interface ExactInputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_INPUT
  inputCurrencyAmountRaw: string
  expectedOutputCurrencyAmountRaw: string
  minimumOutputCurrencyAmountRaw: string
}

export interface ExactOutputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_OUTPUT
  outputCurrencyAmountRaw: string
  expectedInputCurrencyAmountRaw: string
  maximumInputCurrencyAmountRaw: string
}

export interface WrapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Wrap
  unwrapped: boolean
  currencyAmountRaw: string
}

export interface SendTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Send
  assetType: AssetType
  recipient: string
  tokenAddress: string
  currencyAmountRaw?: string
  tokenId?: string // optional. NFT token id
  nftSummaryInfo?: NFTSummaryInfo // optional. NFT metadata
}

export interface ReceiveTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Receive
  assetType: AssetType
  currencyAmountRaw?: string
  sender: string
  tokenAddress: string
  tokenId?: string // optional. NFT token id
  nftSummaryInfo?: NFTSummaryInfo
  isSpam?: boolean
}

export interface FiatPurchaseTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.FiatPurchase
  explorerUrl?: string
  // code will be used for formatting amounts
  inputCurrency?: Pick<MoonpayCurrency, 'type' | 'code'>
  inputCurrencyAmount?: number
  // metadata will be used to get the output currency
  outputCurrency?: Required<Pick<MoonpayCurrency, 'type' | 'metadata'>>
  outputCurrencyAmount?: number
  syncedWithBackend: boolean
}

export interface NFTMintTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTMint
  nftSummaryInfo: NFTSummaryInfo
  purchaseCurrencyId?: string
  purchaseCurrencyAmountRaw?: string
}

export interface NFTTradeTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTTrade
  nftSummaryInfo: NFTSummaryInfo
  purchaseCurrencyId: string
  purchaseCurrencyAmountRaw: string
  tradeType: NFTTradeType
}

export interface NFTApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTApprove
  nftSummaryInfo: NFTSummaryInfo
  spender: string
}

export interface WCConfirmInfo extends BaseTransactionInfo {
  type: TransactionType.WCConfirm
  dapp: DappInfo
}

export interface UnknownTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Unknown
  tokenAddress?: string
}

export type TransactionTypeInfo =
  | ApproveTransactionInfo
  | FiatPurchaseTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | WrapTransactionInfo
  | SendTokenTransactionInfo
  | ReceiveTokenTransactionInfo
  | NFTTradeTransactionInfo
  | NFTApproveTransactionInfo
  | NFTMintTransactionInfo
  | WCConfirmInfo
  | UnknownTransactionInfo
