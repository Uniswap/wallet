import { TradeType } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { FinalizedTransactionStatus, TransactionType } from 'src/features/transactions/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'

export enum AppNotificationType {
  Default,
  Error,
  WalletConnect,
  Transaction,
  Favorites,
  Copied,
  SwapNetwork,
}

interface AppNotificationBase {
  type: AppNotificationType
  address?: Address
  hideDelay?: number
}

export interface AppNotificationDefault extends AppNotificationBase {
  type: AppNotificationType.Default
  title: string
}

export interface AppErrorNotification extends AppNotificationBase {
  type: AppNotificationType.Error
  errorMessage: string
}
export interface WalletConnectNotification extends AppNotificationBase {
  type: AppNotificationType.WalletConnect
  event: WalletConnectEvent
  dappName: string
  imageUrl: string | null
  chainId?: number
}

export interface TransactionNotificationBase extends AppNotificationBase {
  type: AppNotificationType.Transaction
  txType: TransactionType
  txStatus: FinalizedTransactionStatus
  txHash: string
  txId: string
  chainId: ChainId
  tokenAddress?: string
}

export interface ApproveTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Approve
  tokenAddress: string
  spender: string
}

export interface SwapTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Swap
  inputCurrencyId: string
  outputCurrencyId: string
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
  tradeType: TradeType
}

export interface WrapTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Wrap
  currencyAmountRaw: string
  unwrapped: boolean
}

interface TransferCurrencyTxNotificationBase extends TransactionNotificationBase {
  txType: TransactionType.Send | TransactionType.Receive
  assetType: AssetType.Currency
  tokenAddress: string
  currencyAmountRaw: string
}

export interface SendCurrencyTxNotification extends TransferCurrencyTxNotificationBase {
  txType: TransactionType.Send
  recipient: Address
}

export interface ReceiveCurrencyTxNotification extends TransferCurrencyTxNotificationBase {
  txType: TransactionType.Receive
  sender: Address
}

interface TransferNFTNotificationBase extends TransactionNotificationBase {
  txType: TransactionType.Send | TransactionType.Receive
  assetType: AssetType.ERC1155 | AssetType.ERC721
  tokenAddress: string
  tokenId: string
}

export interface SendNFTNotification extends TransferNFTNotificationBase {
  txType: TransactionType.Send
  recipient: Address
}

export interface ReceiveNFTNotification extends TransferNFTNotificationBase {
  txType: TransactionType.Receive
  sender: Address
}

export interface UnknownTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Unknown
}

export type TransferCurrencyTxNotification =
  | SendCurrencyTxNotification
  | ReceiveCurrencyTxNotification

export type TransferNFTTxNotification = SendNFTNotification | ReceiveNFTNotification

export type TransactionNotification =
  | ApproveTxNotification
  | SwapTxNotification
  | WrapTxNotification
  | TransferCurrencyTxNotification
  | TransferNFTTxNotification
  | UnknownTxNotification

export interface CopyNotification extends AppNotificationBase {
  type: AppNotificationType.Copied
}

export interface SwapNetworkNotification extends AppNotificationBase {
  type: AppNotificationType.SwapNetwork
  chainId: ChainId
}

export type AppNotification =
  | AppNotificationDefault
  | AppErrorNotification
  | CopyNotification
  | WalletConnectNotification
  | TransactionNotification
  | SwapNetworkNotification
