import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { WarningAction } from 'src/components/modals/WarningModal/types'
import {
  TokenSelector,
  TokenSelectorFlow,
  TokenSelectorVariation,
} from 'src/components/TokenSelector/TokenSelector'
import { useTokenSelectorActionHandlers } from 'src/features/transactions/hooks'
import { useDerivedSwapInfo, useSwapTxAndGasInfo } from 'src/features/transactions/swap/hooks'
import { useSwapWarnings } from 'src/features/transactions/swap/useSwapWarnings'
import { TransactionFlow, TransactionStep } from 'src/features/transactions/TransactionFlow'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useTransactionGasWarning } from 'src/features/transactions/useTransactionGasWarning'

interface SwapFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

function otherCurrencyField(field: CurrencyField): CurrencyField {
  return field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps): JSX.Element {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const { onSelectCurrency, onHideTokenSelector } = useTokenSelectorActionHandlers(
    dispatch,
    TokenSelectorFlow.Swap
  )
  const { selectingCurrencyField, currencies } = derivedSwapInfo
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)

  const warnings = useSwapWarnings(t, derivedSwapInfo)
  const { txRequest, approveTxRequest, totalGasFee, gasFallbackUsed } = useSwapTxAndGasInfo(
    derivedSwapInfo,
    step === TransactionStep.SUBMITTED ||
      warnings.some((warning) => warning.action === WarningAction.DisableReview)
  )
  const gasWarning = useTransactionGasWarning(derivedSwapInfo, totalGasFee)

  const allWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])

  // keep currencies list option as state so that rendered list remains stable through the slide animation
  const [listVariation, setListVariation] = useState<TokenSelectorVariation>(
    TokenSelectorVariation.BalancesAndPopular
  )

  useEffect(() => {
    if (selectingCurrencyField) {
      setListVariation(
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.BalancesAndPopular
          : TokenSelectorVariation.SuggestedAndPopular
      )
    }
  }, [selectingCurrencyField])

  const onTokenSelectorSelectCurrency = useCallback(
    (currency: Currency, context: SearchContext) => {
      selectingCurrencyField && onSelectCurrency(currency, selectingCurrencyField, context)
    },
    [selectingCurrencyField, onSelectCurrency]
  )

  const exactValue = state.isUSDInput ? state.exactAmountUSD : state.exactAmountToken

  const selectedCurrency = selectingCurrencyField
    ? currencies[selectingCurrencyField]?.currency
    : undefined
  const otherCurrency = selectingCurrencyField
    ? currencies[otherCurrencyField(selectingCurrencyField)]?.currency
    : undefined

  return (
    <TransactionFlow
      approveTxRequest={approveTxRequest}
      derivedInfo={derivedSwapInfo}
      dispatch={dispatch}
      exactValue={exactValue ?? ''}
      flowName={t('Swap')}
      gasFallbackUsed={gasFallbackUsed}
      setStep={setStep}
      showTokenSelector={!!selectingCurrencyField}
      step={step}
      tokenSelector={
        <TokenSelector
          currencyField={selectingCurrencyField}
          flow={TokenSelectorFlow.Swap}
          otherCurrency={otherCurrency}
          selectedCurrency={selectedCurrency}
          variation={listVariation}
          onBack={onHideTokenSelector}
          onSelectCurrency={onTokenSelectorSelectCurrency}
        />
      }
      totalGasFee={totalGasFee}
      txRequest={txRequest}
      warnings={allWarnings}
      onClose={onClose}
    />
  )
}
