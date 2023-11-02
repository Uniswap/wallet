import { Currency } from '@uniswap/sdk-core'
import { LocalizedFormatter } from 'wallet/src/features/language/formatter'
import { getValidAddress, shortenAddress } from 'wallet/src/utils/addresses'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function getFormattedCurrencyAmount(
  currency: Maybe<Currency>,
  currencyAmountRaw: string,
  formatter: LocalizedFormatter,
  isApproximateAmount = false
): string {
  const currencyAmount = getCurrencyAmount({
    value: currencyAmountRaw,
    valueType: ValueType.Raw,
    currency,
  })

  if (!currencyAmount) return ''

  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })
  return isApproximateAmount ? `~${formattedAmount} ` : `${formattedAmount} `
}

export function getCurrencyDisplayText(
  currency: Maybe<Currency>,
  tokenAddressString: Address | undefined
): string | undefined {
  const symbolDisplayText = getSymbolDisplayText(currency?.symbol)

  if (symbolDisplayText) {
    return symbolDisplayText
  }

  return tokenAddressString && getValidAddress(tokenAddressString, true)
    ? shortenAddress(tokenAddressString)
    : tokenAddressString
}

const DEFAULT_MAX_SYMBOL_CHARACTERS = 6

export function getSymbolDisplayText(symbol: Maybe<string>): Maybe<string> {
  if (!symbol) {
    return symbol
  }

  return symbol.length > DEFAULT_MAX_SYMBOL_CHARACTERS
    ? symbol?.substring(0, DEFAULT_MAX_SYMBOL_CHARACTERS - 3) + '...'
    : symbol
}
