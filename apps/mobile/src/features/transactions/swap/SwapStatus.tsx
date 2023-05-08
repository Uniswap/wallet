import { TradeType } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChainId } from 'src/constants/chains'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { useSelectTransaction } from 'src/features/transactions/hooks'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { getInputAmountFromTrade, getOutputAmountFromTrade } from 'src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { toSupportedChainId } from 'src/utils/chainId'

type SwapStatusProps = {
  derivedSwapInfo: DerivedSwapInfo
  onNext: () => void
  onTryAgain: () => void
}

type SwapStatusText = {
  title: string
  description: string
}

const getTextFromTxStatus = (
  t: TFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
): SwapStatusText => {
  if (derivedSwapInfo.wrapType === WrapType.NotApplicable) {
    return getTextFromSwapStatus(t, derivedSwapInfo, transactionDetails)
  }

  return getTextFromWrapStatus(t, derivedSwapInfo, transactionDetails)
}

const getTextFromWrapStatus = (
  t: TFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
): SwapStatusText => {
  const { wrapType } = derivedSwapInfo

  // transactionDetails may not been added to the store yet
  if (!transactionDetails || transactionDetails.status === TransactionStatus.Pending) {
    if (wrapType === WrapType.Unwrap) {
      return {
        title: t('Unwrap pending'),
        description: t('We’ll notify you once your unwrap is complete.'),
      }
    }

    return {
      title: t('Wrap pending'),
      description: t('We’ll notify you once your wrap is complete.'),
    }
  }

  if (transactionDetails.typeInfo.type !== TransactionType.Wrap) {
    throw new Error('input to getTextFromWrapStatus must be a wrap transaction type')
  }

  const status = transactionDetails.status
  if (status === TransactionStatus.Success) {
    const { typeInfo } = transactionDetails
    const { currencies } = derivedSwapInfo

    // input and output amounts are the same for wraps/unwraps
    const inputAmount = getFormattedCurrencyAmount(
      currencies[CurrencyField.INPUT]?.currency,
      typeInfo.currencyAmountRaw
    )

    if (wrapType === WrapType.Unwrap) {
      return {
        title: t('Unwrap successful!'),
        description: t(
          'You unwrapped {{ inputAmount }}{{ inputCurrency }} for {{ inputAmount }}{{ outputCurrency }}.',
          {
            inputAmount,
            inputCurrency: currencies[CurrencyField.INPUT]?.currency.symbol,
            outputCurrency: currencies[CurrencyField.OUTPUT]?.currency.symbol,
          }
        ),
      }
    }

    return {
      title: t('Wrap successful!'),
      description: t(
        'You wrapped {{ inputAmount }}{{ inputCurrency }} for {{ inputAmount }}{{ outputCurrency }}.',
        {
          inputAmount,
          inputCurrency: currencies[CurrencyField.INPUT]?.currency.symbol,
          outputCurrency: currencies[CurrencyField.OUTPUT]?.currency.symbol,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    if (wrapType === WrapType.Unwrap) {
      return {
        title: t('Unwrap failed'),
        description: t('Keep in mind that the network fee is still charged for failed unwraps.'),
      }
    }

    return {
      title: t('Wrap failed'),
      description: t('Keep in mind that the network fee is still charged for failed wraps.'),
    }
  }

  throw new Error('wrap transaction status is in an unhandled state')
}

const getTextFromSwapStatus = (
  t: TFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
): SwapStatusText => {
  // transactionDetails may not been added to the store yet
  if (!transactionDetails || transactionDetails.status === TransactionStatus.Pending) {
    return {
      title: t('Swap pending'),
      description: t('We’ll notify you once your swap is complete.'),
    }
  }

  if (transactionDetails.typeInfo.type !== TransactionType.Swap) {
    throw new Error('input to getTextFromSwapStatus must be a swap transaction type')
  }

  const status = transactionDetails.status

  if (status === TransactionStatus.Success) {
    const { typeInfo } = transactionDetails
    const { currencies } = derivedSwapInfo

    const inputCurrencyAmountRaw = getInputAmountFromTrade(typeInfo)
    const outputCurrencyAmountRaw = getOutputAmountFromTrade(typeInfo)

    const inputCurrency = currencies[CurrencyField.INPUT]
    const outputCurrency = currencies[CurrencyField.OUTPUT]

    const inputAmount = getFormattedCurrencyAmount(
      inputCurrency?.currency,
      inputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_OUTPUT
    )

    const outputAmount = getFormattedCurrencyAmount(
      outputCurrency?.currency,
      outputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_INPUT
    )

    return {
      title: t('Swap successful!'),
      description: t(
        'You swapped {{ inputAmount }}{{ inputCurrency }} for {{ outputAmount }}{{ outputCurrency }}.',
        {
          inputAmount,
          inputCurrency: inputCurrency?.currency.symbol,
          outputAmount,
          outputCurrency: outputCurrency?.currency.symbol,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('Swap failed'),
      description: t('Keep in mind that the network fee is still charged for failed swaps.'),
    }
  }

  throw new Error('swap transaction status is in an unhandled state')
}

export function SwapStatus({ derivedSwapInfo, onNext, onTryAgain }: SwapStatusProps): JSX.Element {
  const { t } = useTranslation()
  const { txId, currencies } = derivedSwapInfo
  const chainId =
    toSupportedChainId(currencies[CurrencyField.INPUT]?.currency.chainId) ?? ChainId.Mainnet
  const activeAddress = useActiveAccountAddressWithThrow()
  const transaction = useSelectTransaction(activeAddress, chainId, txId)

  const { title, description } = useMemo(() => {
    return getTextFromTxStatus(t, derivedSwapInfo, transaction)
  }, [t, transaction, derivedSwapInfo])

  return (
    <TransactionPending
      chainId={chainId}
      description={description}
      title={title}
      transaction={transaction}
      transactionType="swap"
      onNext={onNext}
      onTryAgain={onTryAgain}
    />
  )
}
