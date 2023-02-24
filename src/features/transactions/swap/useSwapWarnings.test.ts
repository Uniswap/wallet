import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/modals/WarningModal/types'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { getSwapWarnings } from 'src/features/transactions/swap/useSwapWarnings'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  daiCurrencyInfo,
  ethCurrencyInfo,
  networkDown,
  networkUnknown,
  networkUp,
} from 'src/test/fixtures'
import { isOffline } from '../utils'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const emptySwapInfo: Pick<
  DerivedSwapInfo,
  'exactAmountToken' | 'exactAmountUSD' | 'chainId' | 'wrapType' | 'focusOnCurrencyField'
> = {
  chainId: 1,
  wrapType: WrapType.NotApplicable,
  exactAmountToken: '1000',
  exactAmountUSD: '1000',
  focusOnCurrencyField: CurrencyField.INPUT,
}

const swapState: DerivedSwapInfo = {
  ...emptySwapInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencies: {
    [CurrencyField.INPUT]: ethCurrencyInfo,
    [CurrencyField.OUTPUT]: undefined,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
}

const insufficientBalanceState: DerivedSwapInfo = {
  ...emptySwapInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '200000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: ethCurrencyInfo,
    [CurrencyField.OUTPUT]: daiCurrencyInfo,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
}

const tradeErrorState: DerivedSwapInfo = {
  ...emptySwapInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '1000'),
    [CurrencyField.OUTPUT]: null,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(ETH, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: daiCurrencyInfo,
    [CurrencyField.OUTPUT]: ethCurrencyInfo,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: {
    loading: false,
    error: { status: 404, data: { errorCode: 'GENERIC_ERROR' } },
    trade: null,
  },
}

const mockTranslate = jest.fn()

describe(getSwapWarnings, () => {
  it('catches incomplete form errors', async () => {
    const warnings = getSwapWarnings(mockTranslate, swapState, isOffline(networkUp))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSwapWarnings(
      mockTranslate,

      insufficientBalanceState,
      isOffline(networkUp)
    )
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...swapState,
      currencyAmounts: {
        ...swapState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getSwapWarnings(
      mockTranslate,

      incompleteAndInsufficientBalanceState,
      isOffline(networkUp)
    )
    expect(warnings.length).toBe(2)
  })

  it('catches errors returned by the routing api', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState, isOffline(networkUp))
    expect(warnings.find((warning) => warning.type === WarningLabel.SwapRouterError)).toBeTruthy()
  })

  it('errors if there is no internet', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState, isOffline(networkDown))
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeTruthy()
  })

  it('does not error when network state is unknown', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState, isOffline(networkUnknown))
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeFalsy()
  })
})
