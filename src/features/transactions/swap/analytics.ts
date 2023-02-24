import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { useEffect, useRef } from 'react'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { SwapTradeBaseProperties } from 'src/features/telemetry/types'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { currencyAddress, getCurrencyAddressForAnalytics } from 'src/utils/currencyId'
import { formatCurrencyAmount, NumberType } from 'src/utils/format'

// hook-based analytics because this one is data-lifecycle dependent
export function useSwapAnalytics(derivedSwapInfo: DerivedSwapInfo): void {
  const {
    trade: { trade },
  } = derivedSwapInfo

  const tradeRef = useRef(trade)

  useEffect(() => {
    tradeRef.current = trade
  }, [trade])

  const inputAmount = tradeRef.current?.inputAmount.toExact()
  const inputCurrency = tradeRef.current?.inputAmount.currency
  const outputCurrency = tradeRef.current?.outputAmount.currency
  const tradeType = tradeRef.current?.tradeType

  // run useEffect based on ids since `Currency` objects themselves may be
  // different instances per render
  const inputCurrencyId = inputCurrency && currencyAddress(inputCurrency)
  const outputCurrencyId = outputCurrency && currencyAddress(outputCurrency)

  // a unique trade is defined by a combination of (input currencyAmount, output token, and trade type)
  // send analytics event only on unique trades and not on swap quote refreshes
  useEffect(() => {
    const currTrade = tradeRef.current
    if (!currTrade || !inputAmount) return

    sendAnalyticsEvent(
      SwapEventName.SWAP_QUOTE_RECEIVED,
      getBaseTradeAnalyticsProperties(currTrade)
    )
  }, [inputAmount, inputCurrencyId, outputCurrencyId, tradeType])

  return
}

export function getBaseTradeAnalyticsProperties(
  trade: Trade<Currency, Currency, TradeType>
): SwapTradeBaseProperties {
  return {
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
    token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    price_impact_basis_points: trade.priceImpact.multiply(100).toSignificant(),
    // TODO: [MOB-3904] add gas fee in USD here once we calculate USD value of `totalGasFee` on swap form instead of just on review
    estimated_network_fee_usd: undefined,
    chain_id: trade.inputAmount.currency.chainId,
    token_in_amount: trade.inputAmount.toExact(),
    token_out_amount: formatCurrencyAmount(trade.outputAmount, NumberType.SwapTradeAmount),
    allowed_slippage_basis_points:
      trade.slippageTolerance !== undefined
        ? BigNumber.from(trade.slippageTolerance).mul(100).toNumber()
        : undefined,
  }
}
