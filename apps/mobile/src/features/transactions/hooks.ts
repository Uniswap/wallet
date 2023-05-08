import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { flowToModalName, TokenSelectorFlow } from 'src/components/TokenSelector/TokenSelector'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { AssetType } from 'src/entities/assets'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import {
  makeSelectAddressTransactions,
  makeSelectTransaction,
} from 'src/features/transactions/selectors'
import {
  createSwapFromStateFromDetails,
  createWrapFormStateFromDetails,
} from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import {
  CurrencyField,
  TransactionState,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { theme } from 'src/styles/theme'
import { currencyAddress } from 'src/utils/currencyId'

export function usePendingTransactions(
  address: Address | null,
  ignoreTransactionTypes: TransactionType[] = []
): TransactionDetails[] | undefined {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.filter(
      (tx: { status: TransactionStatus; typeInfo: { type: TransactionType } }) =>
        tx.status === TransactionStatus.Pending &&
        !ignoreTransactionTypes.includes(tx.typeInfo.type)
    )
  }, [ignoreTransactionTypes, transactions])
}

// sorted oldest to newest
export function useSortedPendingTransactions(
  address: Address | null
): TransactionDetails[] | undefined {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.sort(
      (a: TransactionDetails, b: TransactionDetails) => a.addedTime - b.addedTime
    )
  }, [transactions])
}

export function useSelectTransaction(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionDetails | undefined {
  return useAppSelector(makeSelectTransaction(address, chainId, txId))
}

export function useSelectAddressTransactions(address: Address | null): TransactionDetails[] {
  return useAppSelector(makeSelectAddressTransactions(address))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionState | undefined {
  const transaction = useSelectTransaction(address, chainId, txId)

  const inputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.inputCurrencyId
      : undefined

  const outputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.outputCurrencyId
      : undefined

  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createSwapFromStateFromDetails({
      transactionDetails: transaction,
      inputCurrency: inputCurrencyInfo?.currency,
      outputCurrency: outputCurrencyInfo?.currency,
    })
  }, [chainId, inputCurrencyInfo, outputCurrencyInfo, transaction, txId])
}

export function useCreateWrapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined,
  inputCurrency: NullUndefined<Currency>,
  outputCurrency: NullUndefined<Currency>
): TransactionState | undefined {
  const transaction = useSelectTransaction(address, chainId, txId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createWrapFormStateFromDetails({
      transactionDetails: transaction,
      inputCurrency,
      outputCurrency,
    })
  }, [chainId, inputCurrency, outputCurrency, transaction, txId])
}

export function useTokenSelectorActionHandlers(
  dispatch: React.Dispatch<AnyAction>,
  flow: TokenSelectorFlow
): {
  onShowTokenSelector: (field: CurrencyField) => void
  onHideTokenSelector: () => void
  onSelectCurrency: (currency: Currency, field: CurrencyField, context: SearchContext) => void
} {
  const onShowTokenSelector = useCallback(
    (field: CurrencyField) => dispatch(transactionStateActions.showTokenSelector(field)),
    [dispatch]
  )

  const onHideTokenSelector = useCallback(
    () => dispatch(transactionStateActions.showTokenSelector(undefined)),
    [dispatch]
  )

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField, context: SearchContext) => {
      dispatch(
        transactionStateActions.selectCurrency({
          field,
          tradeableAsset: {
            address: currencyAddress(currency),
            chainId: currency.chainId,
            type: AssetType.Currency,
          },
        })
      )

      // log event that a currency was selected
      sendAnalyticsEvent(MobileEventName.TokenSelected, {
        name: currency.name,
        address: currencyAddress(currency),
        chain: currency.chainId,
        modal: flowToModalName(flow),
        field,
        category: context.category,
        position: context.position,
        suggestion_count: context.suggestionCount,
        query: context.query,
      })

      // hide screen when done selecting
      onHideTokenSelector()
    },
    [dispatch, flow, onHideTokenSelector]
  )
  return { onSelectCurrency, onShowTokenSelector, onHideTokenSelector }
}

/** Set of handlers wrapping actions involving user input */
export function useTokenFormActionHandlers(dispatch: React.Dispatch<AnyAction>): {
  onCreateTxId: (txId: string) => void
  onFocusInput: () => void
  onFocusOutput: () => void
  onSwitchCurrencies: () => void
  onToggleUSDInput: (isUSDInput: boolean) => void
  onSetExactAmount: (field: CurrencyField, value: string, isUSDInput?: boolean) => void
  onSetMax: (amount: string) => void
} {
  const onUpdateExactTokenAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountToken({ field, amount })),
    [dispatch]
  )

  const onUpdateExactUSDAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountUSD({ field, amount })),
    [dispatch]
  )

  const onSetExactAmount = useCallback(
    (field: CurrencyField, value: string, isUSDInput?: boolean) => {
      const updater = isUSDInput ? onUpdateExactUSDAmount : onUpdateExactTokenAmount
      updater(field, value)
    },
    [onUpdateExactUSDAmount, onUpdateExactTokenAmount]
  )

  const onSetMax = useCallback(
    (amount: string) => {
      // when setting max amount, always switch to token mode because
      // our token/usd updater doesnt handle this case yet
      dispatch(transactionStateActions.toggleUSDInput(false))
      dispatch(
        transactionStateActions.updateExactAmountToken({ field: CurrencyField.INPUT, amount })
      )
      // Unfocus the CurrencyInputField by setting focusOnCurrencyField to null
      dispatch(transactionStateActions.onFocus(null))
    },
    [dispatch]
  )

  const onSwitchCurrencies = useCallback(() => {
    dispatch(transactionStateActions.switchCurrencySides())
  }, [dispatch])

  const onToggleUSDInput = useCallback(
    (isUSDInput: boolean) => dispatch(transactionStateActions.toggleUSDInput(isUSDInput)),
    [dispatch]
  )

  const onCreateTxId = useCallback(
    (txId: string) => dispatch(transactionStateActions.setTxId(txId)),
    [dispatch]
  )

  const onFocusInput = useCallback(
    () => dispatch(transactionStateActions.onFocus(CurrencyField.INPUT)),
    [dispatch]
  )
  const onFocusOutput = useCallback(
    () => dispatch(transactionStateActions.onFocus(CurrencyField.OUTPUT)),
    [dispatch]
  )
  return {
    onCreateTxId,
    onFocusInput,
    onFocusOutput,
    onSwitchCurrencies,
    onToggleUSDInput,
    onSetExactAmount,
    onSetMax,
  }
}

/**
 * Merge local and remote transactions. If duplicated hash found use data from local store.
 */
export function useMergeLocalAndRemoteTransactions(
  address: string,
  remoteTransactions: TransactionDetails[]
): TransactionDetails[] {
  const localTransactions = useSelectAddressTransactions(address)

  // Merge local and remote txns into array of single type.
  const combinedTransactionList = useMemo((): TransactionDetails[] => {
    if (!address) return EMPTY_ARRAY

    const localHashes: Set<string> = new Set()
    localTransactions.forEach((t: { hash: string }) => localHashes.add(t.hash))

    const deDupedRemoteTxs = remoteTransactions.reduce((accum: TransactionDetails[], txn) => {
      if (!localHashes.has(txn.hash)) accum.push(txn) // dedupe
      return accum
    }, [])

    return [...localTransactions, ...deDupedRemoteTxs].sort((a, b) =>
      a.addedTime > b.addedTime ? -1 : 1
    )
  }, [address, localTransactions, remoteTransactions])

  return combinedTransactionList
}

export function useLowestPendingNonce(): BigNumberish | undefined {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const pending = usePendingTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    if (!pending) return
    pending.map((txn: TransactionDetails) => {
      const currentNonce = txn.options?.request?.nonce
      min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
    })
    return min
  }, [pending])
}

/**
 * Gets all transactions from a given sender and to a given recipient
 * @param sender Get all transactions sent by this sender
 * @param recipient Then filter so that we only keep txns to this recipient
 */
export function useAllTransactionsBetweenAddresses(
  sender: Address,
  recipient: string | undefined | null
): TransactionDetails[] {
  const txnsToSearch = useSelectAddressTransactions(sender)
  return useMemo(() => {
    if (!sender || !recipient || !txnsToSearch) return EMPTY_ARRAY
    const commonTxs = txnsToSearch.filter(
      (tx: TransactionDetails) =>
        tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient
    )
    return commonTxs.length ? commonTxs : EMPTY_ARRAY
  }, [recipient, sender, txnsToSearch])
}

const MIN_INPUT_DECIMALPAD_GAP = theme.spacing.spacing12

export function useShouldShowNativeKeyboard(): {
  onInputPanelLayout: (event: LayoutChangeEvent) => void
  onDecimalPadLayout: (event: LayoutChangeEvent) => void
  isLayoutPending: boolean
  showNativeKeyboard: boolean
} {
  const [containerHeight, setContainerHeight] = useState<number>()
  const [decimalPadY, setDecimalPadY] = useState<number>()

  const onInputPanelLayout = (event: LayoutChangeEvent): void => {
    if (containerHeight === undefined) {
      setContainerHeight(event.nativeEvent.layout.height)
    }
  }

  const onDecimalPadLayout = (event: LayoutChangeEvent): void => {
    if (decimalPadY === undefined) {
      setDecimalPadY(event.nativeEvent.layout.y)
    }
  }

  const isLayoutPending = containerHeight === undefined || decimalPadY === undefined

  // If decimal pad renders below the input panel, we need to show the native keyboard
  const showNativeKeyboard = isLayoutPending
    ? false
    : containerHeight + MIN_INPUT_DECIMALPAD_GAP > decimalPadY

  return {
    onInputPanelLayout,
    onDecimalPadLayout,
    isLayoutPending,
    showNativeKeyboard,
  }
}

export function useDynamicFontSizing(
  maxCharWidthAtMaxFontSize: number,
  maxFontSize: number,
  minFontSize: number
): {
  onLayout: (event: LayoutChangeEvent) => void
  fontSize: number
  onSetFontSize: (amount: string) => void
} {
  const [fontSize, setFontSize] = useState(maxFontSize)
  const [textInputElementWidth, setTextInputElementWidth] = useState<number>(0)

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (textInputElementWidth) return

      const width = event.nativeEvent.layout.width
      setTextInputElementWidth(width)
    },
    [setTextInputElementWidth, textInputElementWidth]
  )

  const onSetFontSize = useCallback(
    (amount: string) => {
      const stringWidth = getStringWidth(amount, maxCharWidthAtMaxFontSize, fontSize, maxFontSize)
      const scaledSize = fontSize * (textInputElementWidth / stringWidth)
      const scaledSizeWithMin = Math.max(scaledSize, minFontSize)
      const newFontSize = Math.round(Math.min(maxFontSize, scaledSizeWithMin))
      setFontSize(newFontSize)
    },
    [fontSize, maxFontSize, minFontSize, maxCharWidthAtMaxFontSize, textInputElementWidth]
  )

  return { onLayout, fontSize, onSetFontSize }
}

const getStringWidth = (
  value: string,
  maxCharWidthAtMaxFontSize: number,
  currentFontSize: number,
  maxFontSize: number
): number => {
  const widthAtMaxFontSize = value.length * maxCharWidthAtMaxFontSize
  return widthAtMaxFontSize * (currentFontSize / maxFontSize)
}
