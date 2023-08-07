import { Token } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import {
  Amount,
  Chain,
  Currency,
  TokenStandard,
  TransactionListQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import extractTransactionDetails from 'wallet/src/features/transactions/history/conversion/extractTransactionDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { getNativeCurrencyAddressForChain } from 'wallet/src/utils/currencyId'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export interface AllFormattedTransactions {
  last24hTransactionList: TransactionDetails[]
  // Maps year <-> TransactionSummaryInfo[] for all months before current month
  priorByMonthTransactionList: Record<string, TransactionDetails[]>
  pending: TransactionDetails[]
}

export function formatTransactionsByDate(
  transactions: TransactionDetails[] | undefined
): AllFormattedTransactions {
  // timestamp in ms for start of time periods
  const msTimestampCutoff24h = dayjs().subtract(24, 'hour').valueOf()
  const msTimestampCutoffYear = dayjs().startOf('year').valueOf()

  // Segment by time periods.
  const [pending, last24hTransactionList, olderThan24HTransactionList] = (
    transactions ?? []
  ).reduce<[TransactionDetails[], TransactionDetails[], TransactionDetails[]]>(
    (accum, item) => {
      if (
        // Want all incomplete transactions
        item.status === TransactionStatus.Pending ||
        item.status === TransactionStatus.Cancelling ||
        item.status === TransactionStatus.Replacing
      ) {
        accum[0].push(item)
      } else if (item.addedTime > msTimestampCutoff24h) {
        accum[1].push(item)
      } else {
        accum[2].push(item)
      }
      return accum
    },
    [[], [], []]
  )

  // sort pending txns based on nonce, highest nonce first for reverse chronological order
  const pendingSorted = pending.sort((a, b) => {
    const nonceA = a.options?.request?.nonce
    const nonceB = b.options?.request?.nonce
    return nonceA && nonceB ? (nonceA < nonceB ? 1 : -1) : 1
  })

  // For all transactions before last 24 hours, group by month
  const priorByMonthTransactionList = olderThan24HTransactionList.reduce(
    (accum: Record<string, TransactionDetails[]>, item) => {
      const isPreviousYear = item.addedTime < msTimestampCutoffYear
      const key = dayjs(item.addedTime)
        // If in a previous year, append year to key string, else just use month
        // This key is used as the section title in TransactionList
        .format(isPreviousYear ? 'MMMM YYYY' : 'MMMM')
        .toString()
      const currentMonthList = accum[key] ?? []
      currentMonthList.push(item)
      accum[key] = currentMonthList
      return accum
    },
    {}
  )

  return {
    pending: pendingSorted,
    last24hTransactionList,
    priorByMonthTransactionList,
  }
}

/**
 * Transforms api txn data to formatted TransactionDetails array
 * @param data Transaction history data response
 */
export function parseDataResponseToTransactionDetails(
  data: TransactionListQuery,
  hideSpamTokens?: boolean
): TransactionDetails[] {
  if (data.portfolios?.[0]?.assetActivities) {
    return data.portfolios[0].assetActivities.reduce((accum: TransactionDetails[], t) => {
      const parsed = extractTransactionDetails(t)

      // Filter out spam if desired, currently only for send/receive transactions
      const isSpam =
        (parsed?.typeInfo.type === TransactionType.Receive && parsed.typeInfo.isSpam) ||
        (parsed?.typeInfo.type === TransactionType.Send && parsed.typeInfo.isSpam)

      if (parsed && !(hideSpamTokens && isSpam)) {
        accum.push(parsed)
      }

      return accum
    }, [])
  }
  return []
}

/**
 * Constructs a CurrencyAmount based on asset details and quantity. Checks if token is native
 * or ERC20 to determine decimal amount.
 * @param tokenStandard token standard type from api query
 * @param quantity // formatted amount of asset transferred
 * @param decimals // decimals ((optional) if native token)
 * @returns
 */
export function deriveCurrencyAmountFromAssetResponse(
  tokenStandard: TokenStandard,
  chain: Chain,
  address: Maybe<string>,
  decimals: Maybe<number>,
  quantity: string
): string {
  const chainId = fromGraphQLChain(chain)
  if (!chainId) return ''

  const currency =
    tokenStandard === TokenStandard.Native
      ? NativeCurrency.onChain(chainId)
      : address && decimals
      ? new Token(chainId, address, decimals)
      : undefined

  const currencyAmount = getCurrencyAmount({
    value: quantity,
    valueType: ValueType.Exact,
    currency,
  })

  return currencyAmount?.quotient.toString() ?? ''
}

/**
 * Parses an asset from API and returns either the token address or native currency address
 * for the involved asset.
 * @returns Token address, custom native address or null
 */
export function getAddressFromAsset({
  tokenStandard,
  chain,
  address,
}: {
  tokenStandard: TokenStandard
  chain: Chain | undefined
  address: Maybe<string>
}): Maybe<string> {
  const supportedChainId = fromGraphQLChain(chain)
  if (!supportedChainId) {
    return null
  }
  if (tokenStandard === TokenStandard.Native) {
    return getNativeCurrencyAddressForChain(supportedChainId)
  }
  return address
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed USD value as a number if currency is of type USD
 */
export function parseUSDValueFromAssetChange(
  transactedValue: Maybe<Partial<Amount>>
): number | undefined {
  return transactedValue?.currency === Currency.Usd ? transactedValue.value ?? undefined : undefined
}
