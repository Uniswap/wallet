import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'

// TODO: [MOB-3924] better handle non-ETH
export const MIN_NATIVE_CURRENCY_FOR_GAS: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH

/**
 * Given some token amount, return the max that can be spent of it
 * https://github.com/Uniswap/interface/blob/main/src/utils/maxAmountSpend.ts
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(
  currencyAmount?: CurrencyAmount<Currency> | null
): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency.isNative) {
    if (JSBI.greaterThan(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)) {
      return CurrencyAmount.fromRawAmount(
        currencyAmount.currency,
        JSBI.subtract(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)
      )
    } else {
      return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.BigInt(0))
    }
  }
  return currencyAmount
}
