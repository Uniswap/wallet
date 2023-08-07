import { RenderPassReport } from '@shopify/react-native-performance'
import { MoonpayEventName, SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { ImportType } from 'src/features/onboarding/utils'
import { MobileEventName } from 'src/features/telemetry/constants'
import { ChainId } from 'wallet/src/constants/chains'
import { TraceProps } from 'wallet/src/features/telemetry/trace/Trace'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { EthMethod, WCEventType, WCRequestOutcome } from 'wallet/src/features/walletConnect/types'

export type SwapTradeBaseProperties = {
  allowed_slippage_basis_points?: number
  token_in_symbol?: string
  token_out_symbol?: string
  token_in_address: string
  token_out_address: string
  price_impact_basis_points?: string
  estimated_network_fee_usd?: number
  chain_id: number
  token_in_amount: string
  token_out_amount: string
} & TraceProps

type SwapTransactionResultProperties = {
  address: string
  chain_id: number
  hash: string
  added_time: number
  confirmed_time?: number
  gas_used?: number
  effective_gas_price?: number
  tradeType: string
  inputCurrencyId: string
  outputCurrencyId: string
  slippageTolerance?: number
  gasUseEstimate?: string
  route?: string
  quoteId?: string
}

// Events related to Moonpay internal transactions
// NOTE: we do not currently have access to the full life cycle of these txs
// because we do not yet use Moonpay's webhook
export type MoonpayTransactionEventProperties = TraceProps &
  // allow any object of strings for now
  Record<string, string>

export type AssetDetailsBaseProperties = {
  name?: string
  address: string
  chain?: number
}

export type SearchResultContextProperties = {
  category?: string
  query?: string
  suggestion_count?: number
  position?: number
  isHistory?: boolean
}

type OnboardingCompletedProps = {
  wallet_type: ImportType
  accounts_imported_count: number
  wallets_imported: string[]
  cloud_backup_used: boolean
}

export type MobileEventProperties = {
  [MobileEventName.BalancesReport]: {
    total_balances_usd: number
    wallets: string[]
    balances: number[]
  }
  [MobileEventName.DeepLinkOpened]: {
    url: string
    screen: 'swap' | 'transaction'
    is_cold_start: boolean
  }
  [MobileEventName.ExploreFilterSelected]: {
    filter_type: string
  }
  [MobileEventName.ExploreSearchResultClicked]: SearchResultContextProperties &
    AssetDetailsBaseProperties & {
      type: 'collection' | 'token' | 'address'
    }
  [MobileEventName.ExploreSearchCancel]: {
    query: string
  }
  [MobileEventName.ExploreTokenItemSelected]: AssetDetailsBaseProperties & {
    position: number
  }
  [MobileEventName.FavoriteItem]: AssetDetailsBaseProperties & {
    type: 'token' | 'wallet'
  }
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: TraceProps
  [MobileEventName.FiatOnRampBannerPressed]: TraceProps
  [MobileEventName.FiatOnRampAmountEntered]: TraceProps & { source: 'chip' | 'textInput' }
  [MobileEventName.FiatOnRampWidgetOpened]: TraceProps & { externalTransactionId: string }
  [MobileEventName.NetworkFilterSelected]: TraceProps & {
    chain: ChainId | 'All'
  }
  [MobileEventName.OnboardingCompleted]: OnboardingCompletedProps & TraceProps
  [MobileEventName.PerformanceReport]: RenderPassReport
  [MobileEventName.PerformanceGraphql]: {
    dataSize: number
    duration: number
    operationName: string
    operationType?: string
  }
  [MobileEventName.PortfolioBalanceFreshnessLag]: {
    freshnessLag: number
    updatedCurrencies: string[]
  }
  [MobileEventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
  [MobileEventName.TokenDetailsOtherChainButtonPressed]: TraceProps
  [MobileEventName.TokenSelected]: TraceProps &
    AssetDetailsBaseProperties &
    SearchResultContextProperties & {
      field: CurrencyField
    }
  [MobileEventName.WalletAdded]: OnboardingCompletedProps & TraceProps
  [MobileEventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod
    dapp_url: string
    dapp_name: string
    wc_version: '1' | '2'
    chain_id?: number
    outcome: WCRequestOutcome
  }
  [MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED]: {
    success: boolean
    networkError: boolean
  } & TraceProps
  [SharedEventName.APP_LOADED]: TraceProps | undefined
  [SharedEventName.ELEMENT_CLICKED]: TraceProps
  [SharedEventName.PAGE_VIEWED]: TraceProps
  [SwapEventName.SWAP_DETAILS_EXPANDED]: TraceProps | undefined
  [SwapEventName.SWAP_QUOTE_RECEIVED]: {
    quote_latency_milliseconds?: number
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED]: {
    estimated_network_fee_wei?: string
    gas_limit?: string
    transaction_deadline_seconds?: number
    token_in_amount_usd?: number
    token_out_amount_usd?: number
    is_auto_slippage?: boolean
    swap_quote_block_number?: string
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_TRANSACTION_COMPLETED]: SwapTransactionResultProperties
  [SwapEventName.SWAP_TRANSACTION_FAILED]: SwapTransactionResultProperties
}
