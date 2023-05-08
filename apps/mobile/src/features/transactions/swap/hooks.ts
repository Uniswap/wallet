// TODO(MOB-3867): reduce file length
/* eslint-disable max-lines */
import { MaxUint256 } from '@ethersproject/constants'
import { SwapEventName } from '@uniswap/analytics-events'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { providers } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnyAction } from 'redux'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { useAppDispatch } from 'src/app/hooks'
import { useContractManager, useProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { useOnChainCurrencyBalance } from 'src/features/balances/api'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { FEATURE_FLAGS } from 'src/features/experiments/constants'
import { useFeatureFlag } from 'src/features/experiments/hooks'
import { useTransactionGasFee } from 'src/features/gas/hooks'
import { GasSpeed } from 'src/features/gas/types'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { useSimulatedGasLimit } from 'src/features/routing/hooks'
import {
  STABLECOIN_AMOUNT_OUT,
  useUSDCPrice,
  useUSDCValue,
} from 'src/features/routing/useUSDCPrice'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import { PERMITTABLE_TOKENS } from 'src/features/transactions/permit/permittableTokens'
import { usePermitSignature } from 'src/features/transactions/permit/usePermitSignature'
import { getBaseTradeAnalyticsProperties } from 'src/features/transactions/swap/analytics'
import { swapActions } from 'src/features/transactions/swap/swapSaga'
import { usePermit2Signature } from 'src/features/transactions/swap/usePermit2Signature'
import { Trade, useSetTradeSlippage, useTrade } from 'src/features/transactions/swap/useTrade'
import {
  getSwapMethodParameters,
  getWrapType,
  isWrapAction,
  sumGasFees,
} from 'src/features/transactions/swap/utils'
import {
  getWethContract,
  tokenWrapActions,
  WrapType,
} from 'src/features/transactions/swap/wrapSaga'
import {
  CurrencyField,
  TransactionState,
  updateExactAmountToken,
  updateExactAmountUSD,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import { useActiveAccount, useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { areAddressesEqual } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatCurrencyAmount, NumberType } from 'src/utils/format'
import { useAsyncData, usePrevious } from 'src/utils/hooks'
import { logger } from 'src/utils/logger'
import { toStringish } from 'src/utils/number'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'

const NUM_USD_DECIMALS_DISPLAY = 2

export type DerivedSwapInfo<
  TInput = CurrencyInfo,
  TOutput extends CurrencyInfo = CurrencyInfo
> = BaseDerivedInfo<TInput> & {
  chainId: ChainId
  currencies: BaseDerivedInfo<TInput>['currencies'] & {
    [CurrencyField.OUTPUT]: NullUndefined<TOutput>
  }
  currencyAmounts: BaseDerivedInfo<TInput>['currencyAmounts'] & {
    [CurrencyField.OUTPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  currencyAmountsUSDValue: {
    [CurrencyField.INPUT]: NullUndefined<CurrencyAmount<Currency>>
    [CurrencyField.OUTPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  currencyBalances: BaseDerivedInfo<TInput>['currencyBalances'] & {
    [CurrencyField.OUTPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  focusOnCurrencyField: CurrencyField | null
  trade: ReturnType<typeof useTrade>
  wrapType: WrapType
  selectingCurrencyField?: CurrencyField
  txId?: string
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
}

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo(state: TransactionState): DerivedSwapInfo {
  const {
    [CurrencyField.INPUT]: currencyAssetIn,
    [CurrencyField.OUTPUT]: currencyAssetOut,
    exactAmountUSD,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField = CurrencyField.INPUT,
    selectingCurrencyField,
    txId,
    customSlippageTolerance,
  } = state

  const activeAccount = useActiveAccount()

  const currencyInInfo = useCurrencyInfo(
    currencyAssetIn ? buildCurrencyId(currencyAssetIn.chainId, currencyAssetIn.address) : undefined
  )

  const currencyOutInfo = useCurrencyInfo(
    currencyAssetOut
      ? buildCurrencyId(currencyAssetOut.chainId, currencyAssetOut.address)
      : undefined
  )

  const currencies = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyInInfo,
      [CurrencyField.OUTPUT]: currencyOutInfo,
    }
  }, [currencyInInfo, currencyOutInfo])

  const currencyIn = currencyInInfo?.currency
  const currencyOut = currencyOutInfo?.currency

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? ChainId.Mainnet

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(currencyIn, activeAccount?.address)
  const { balance: tokenOutBalance } = useOnChainCurrencyBalance(
    currencyOut,
    activeAccount?.address
  )

  const isExactIn = exactCurrencyField === CurrencyField.INPUT
  const wrapType = getWrapType(currencyIn, currencyOut)

  const otherCurrency = isExactIn ? currencyOut : currencyIn
  const exactCurrency = isExactIn ? currencyIn : currencyOut

  // amountSpecified, otherCurrency, tradeType fully defines a trade
  const amountSpecified = useMemo(() => {
    return tryParseExactAmount(exactAmountToken, exactCurrency)
  }, [exactAmountToken, exactCurrency])

  const shouldGetQuote = !isWrapAction(wrapType)

  // Fetch the trade quote. If customSlippageTolerance is undefined, then the quote is fetched with DEFAULT_SLIPPAGE_TOLERANCE
  const tradeWithoutSlippage = useTrade({
    amountSpecified: shouldGetQuote ? amountSpecified : null,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    customSlippageTolerance,
  })

  // Calculate autolippage tolerance for trade. If customSlippageTolerance is undefined, then the Trade slippage is set to the calculated value.
  const { trade, autoSlippageTolerance } = useSetTradeSlippage(
    tradeWithoutSlippage,
    customSlippageTolerance
  )

  const currencyAmounts = useMemo(
    () =>
      shouldGetQuote
        ? {
            [CurrencyField.INPUT]:
              exactCurrencyField === CurrencyField.INPUT
                ? amountSpecified
                : trade.trade?.inputAmount,
            [CurrencyField.OUTPUT]:
              exactCurrencyField === CurrencyField.OUTPUT
                ? amountSpecified
                : trade.trade?.outputAmount,
          }
        : {
            [CurrencyField.INPUT]: amountSpecified,
            [CurrencyField.OUTPUT]: amountSpecified,
          },
    [
      amountSpecified,
      exactCurrencyField,
      shouldGetQuote,
      trade.trade?.inputAmount,
      trade.trade?.outputAmount,
    ]
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  const currencyAmountsUSDValue = useMemo(() => {
    return {
      [CurrencyField.INPUT]: inputCurrencyUSDValue,
      [CurrencyField.OUTPUT]: outputCurrencyUSDValue,
    }
  }, [inputCurrencyUSDValue, outputCurrencyUSDValue])

  const currencyBalances = useMemo(() => {
    return {
      [CurrencyField.INPUT]: tokenInBalance,
      [CurrencyField.OUTPUT]: tokenOutBalance,
    }
  }, [tokenInBalance, tokenOutBalance])

  return useMemo(() => {
    return {
      chainId,
      currencies,
      currencyAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
      exactAmountToken,
      exactAmountUSD,
      exactCurrencyField,
      focusOnCurrencyField,
      trade,
      wrapType,
      selectingCurrencyField,
      txId,
      autoSlippageTolerance,
      customSlippageTolerance,
    }
  }, [
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyAmountsUSDValue,
    exactAmountToken,
    exactAmountUSD,
    exactCurrencyField,
    focusOnCurrencyField,
    selectingCurrencyField,
    trade,
    txId,
    wrapType,
    autoSlippageTolerance,
    customSlippageTolerance,
  ])
}

export function useUSDTokenUpdater(
  dispatch: React.Dispatch<AnyAction>,
  isUSDInput: boolean,
  exactAmountToken: string,
  exactAmountUSD: string,
  exactCurrency?: Currency
): void {
  const price = useUSDCPrice(exactCurrency)
  const shouldUseUSDRef = useRef(isUSDInput)

  useEffect(() => {
    shouldUseUSDRef.current = isUSDInput
  }, [isUSDInput])

  useEffect(() => {
    if (!exactCurrency || !price) return

    if (shouldUseUSDRef.current) {
      const stablecoinAmount = tryParseExactAmount(
        exactAmountUSD,
        STABLECOIN_AMOUNT_OUT[exactCurrency.chainId]?.currency
      )
      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined

      return dispatch(
        updateExactAmountToken({
          amount: formatCurrencyAmount(currencyAmount, NumberType.SwapTradeAmount, ''),
        })
      )
    }

    const exactCurrencyAmount = tryParseExactAmount(exactAmountToken, exactCurrency)
    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    return dispatch(
      updateExactAmountUSD({ amount: usdPrice?.toFixed(NUM_USD_DECIMALS_DISPLAY) || '' })
    )
  }, [dispatch, shouldUseUSDRef, exactAmountUSD, exactAmountToken, exactCurrency, price])
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // not enough allowance and token cannot be approved through .permit instead
  Approve = 'approve',

  // not enough allowance but token can be approved through permit signature
  Permit = 'permit',

  Permit2Approve = 'permit2-approve',
}

type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Permit
      txRequest: null
    }
  | {
      action: ApprovalAction.Approve | ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
    }

interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  gasFallbackUsed: boolean
}

export function useTransactionRequestInfo(
  derivedSwapInfo: DerivedSwapInfo,
  tokenApprovalInfo?: TokenApprovalInfo
): TransactionRequestInfo {
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)
  const swapTxRequest = useSwapTransactionRequest(derivedSwapInfo, tokenApprovalInfo)
  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable
  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : swapTxRequest.transactionRequest,
    gasFallbackUsed: !isWrapApplicable && swapTxRequest.gasFallbackUsed,
  }
}

function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo
): providers.TransactionRequest | undefined {
  const address = useActiveAccountAddressWithThrow()
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo
  const provider = useProvider(chainId)

  const transactionFetcher = useCallback(() => {
    if (!provider || wrapType === WrapType.NotApplicable) return

    return getWrapTransactionRequest(
      provider,
      chainId,
      address,
      wrapType,
      currencyAmounts[CurrencyField.INPUT]
    )
  }, [address, chainId, wrapType, currencyAmounts, provider])

  return useAsyncData(transactionFetcher).data
}

const getWrapTransactionRequest = async (
  provider: providers.Provider,
  chainId: ChainId,
  address: Address,
  wrapType: WrapType,
  currencyAmountIn: NullUndefined<CurrencyAmount<Currency>>
): Promise<providers.TransactionRequest | undefined> => {
  if (!currencyAmountIn) return

  const wethContract = await getWethContract(chainId, provider)
  const wethTx =
    wrapType === WrapType.Wrap
      ? await wethContract.populateTransaction.deposit({
          value: `0x${currencyAmountIn.quotient.toString(16)}`,
        })
      : await wethContract.populateTransaction.withdraw(
          `0x${currencyAmountIn.quotient.toString(16)}`
        )

  return { ...wethTx, from: address, chainId }
}

const MAX_APPROVE_AMOUNT = MaxUint256
export function useTokenApprovalInfo(
  chainId: ChainId,
  wrapType: WrapType,
  currencyInAmount: NullUndefined<CurrencyAmount<Currency>>
): TokenApprovalInfo | undefined {
  const address = useActiveAccountAddressWithThrow()
  const provider = useProvider(chainId)
  const contractManager = useContractManager()
  const permit2Enabled = useFeatureFlag(FEATURE_FLAGS.SwapPermit2)

  const transactionFetcher = useCallback(() => {
    if (!provider || !currencyInAmount || !currencyInAmount.currency) return

    if (permit2Enabled) {
      return getTokenPermit2ApprovalInfo(
        provider,
        contractManager,
        address,
        wrapType,
        currencyInAmount
      )
    }

    return getTokenApprovalInfo(provider, contractManager, address, wrapType, currencyInAmount)
  }, [address, contractManager, currencyInAmount, provider, wrapType, permit2Enabled])

  return useAsyncData(transactionFetcher).data
}

const getTokenPermit2ApprovalInfo = async (
  provider: providers.Provider,
  contractManager: ContractManager,
  address: Address,
  wrapType: WrapType,
  currencyInAmount: CurrencyAmount<Currency>
): Promise<TokenApprovalInfo | undefined> => {
  // wrap/unwraps do not need approval
  if (wrapType !== WrapType.NotApplicable) return { action: ApprovalAction.None, txRequest: null }

  const currencyIn = currencyInAmount.currency
  // native tokens do not need approvals
  if (currencyIn.isNative) return { action: ApprovalAction.None, txRequest: null }

  const currencyInAmountRaw = currencyInAmount.quotient.toString()
  const chainId = currencyInAmount.currency.chainId
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    currencyIn.address,
    provider,
    ERC20_ABI
  )

  const allowance = await tokenContract.callStatic.allowance(address, PERMIT2_ADDRESS)
  if (!allowance.lt(currencyInAmountRaw)) {
    return { action: ApprovalAction.None, txRequest: null }
  }

  let baseTransaction
  try {
    baseTransaction = await tokenContract.populateTransaction.approve(
      PERMIT2_ADDRESS,
      // max approve on Permit2 since this method costs gas and we don't want users
      // to have to pay approval gas on every tx
      MAX_APPROVE_AMOUNT,
      { from: address }
    )
  } catch {
    // above call errors when token restricts max approvals
    baseTransaction = await tokenContract.populateTransaction.approve(
      PERMIT2_ADDRESS,
      currencyInAmountRaw,
      { from: address }
    )
  }

  return {
    txRequest: { ...baseTransaction, from: address, chainId },
    action: ApprovalAction.Permit2Approve,
  }
}

const getTokenApprovalInfo = async (
  provider: providers.Provider,
  contractManager: ContractManager,
  address: Address,
  wrapType: WrapType,
  currencyInAmount: CurrencyAmount<Currency>
): Promise<TokenApprovalInfo | undefined> => {
  // wrap/unwraps do not need approval
  if (wrapType !== WrapType.NotApplicable) return { action: ApprovalAction.None, txRequest: null }

  const currencyIn = currencyInAmount.currency
  // native tokens do not need approvals
  if (currencyIn.isNative) return { action: ApprovalAction.None, txRequest: null }

  const currencyInAmountRaw = currencyInAmount.quotient.toString()
  const chainId = currencyInAmount.currency.chainId as ChainId
  const spender = SWAP_ROUTER_ADDRESSES[chainId]
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    currencyIn.address,
    provider,
    ERC20_ABI
  )
  const allowance = await tokenContract.callStatic.allowance(address, spender)
  if (!allowance.lt(currencyInAmountRaw)) {
    return { action: ApprovalAction.None, txRequest: null }
  }

  const permittableTokens = PERMITTABLE_TOKENS[chainId]

  const isPermittable = permittableTokens
    ? Object.keys(permittableTokens).some((pemittableTokenAddress) =>
        areAddressesEqual(pemittableTokenAddress, currencyIn.address)
      )
    : false

  if (isPermittable) {
    return { action: ApprovalAction.Permit, txRequest: null }
  }

  let baseTransaction
  try {
    baseTransaction = await tokenContract.populateTransaction.approve(spender, MAX_APPROVE_AMOUNT, {
      from: address,
    })
  } catch {
    // above call errors when token restricts max approvals
    baseTransaction = await tokenContract.populateTransaction.approve(
      spender,
      currencyInAmountRaw,
      { from: address }
    )
  }

  return {
    txRequest: { ...baseTransaction, from: address, chainId },
    action: ApprovalAction.Approve,
  }
}

export function useSwapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  tokenApprovalInfo?: TokenApprovalInfo
): TransactionRequestInfo {
  const {
    chainId,
    trade: { trade },
    wrapType,
    exactCurrencyField,
    currencies,
    currencyAmounts,
  } = derivedSwapInfo

  const permit2Enabled = useFeatureFlag(FEATURE_FLAGS.SwapPermit2)
  const address = useActiveAccountAddressWithThrow()

  const { data: permitInfo, isLoading: permitInfoLoading } = usePermitSignature(
    chainId,
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    // skips if tokenApprovalInfo.action is not ApprovalAction.Permit
    tokenApprovalInfo?.action
  )

  const { data: permit2Signature, isLoading: permit2InfoLoading } = usePermit2Signature(
    currencyAmounts[CurrencyField.INPUT],
    !permit2Enabled
  )

  const [otherCurrency, tradeType] =
    exactCurrencyField === CurrencyField.INPUT
      ? [currencies[CurrencyField.OUTPUT]?.currency, TradeType.EXACT_INPUT]
      : [currencies[CurrencyField.INPUT]?.currency, TradeType.EXACT_OUTPUT]

  // get simulated gasLimit only if token doesn't have enough allowance AND we can't get the allowance
  // through .permit instead
  const shouldFetchSimulatedGasLimit =
    tokenApprovalInfo?.action === ApprovalAction.Approve ||
    tokenApprovalInfo?.action === ApprovalAction.Permit2Approve

  const {
    isLoading: simulatedGasLimitLoading,
    simulatedGasLimit,
    gasFallbackUsed,
  } = useSimulatedGasLimit(
    chainId,
    currencyAmounts[exactCurrencyField],
    otherCurrency,
    tradeType,
    !shouldFetchSimulatedGasLimit,
    permit2Signature
  )

  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  return useMemo(() => {
    if (
      wrapType !== WrapType.NotApplicable ||
      !currencyAmountIn ||
      !tokenApprovalInfo ||
      (!simulatedGasLimit && simulatedGasLimitLoading) ||
      permitInfoLoading ||
      permit2InfoLoading ||
      !trade
    ) {
      return { transactionRequest: undefined, gasFallbackUsed }
    }

    // if the swap transaction does not require a Tenderly gas limit simulation, submit "undefined" here
    // so that ethers can calculate the gasLimit later using .estimateGas(tx) instead
    const gasLimit = shouldFetchSimulatedGasLimit ? simulatedGasLimit : undefined
    const { calldata, value } = getSwapMethodParameters({
      permit2Signature,
      permitInfo,
      trade,
      address,
      universalRouterEnabled: permit2Enabled,
    })

    const transactionRequest = {
      from: address,
      to: permit2Enabled ? UNIVERSAL_ROUTER_ADDRESS(chainId) : SWAP_ROUTER_ADDRESSES[chainId],
      gasLimit,
      chainId,
      data: calldata,
      value,
    }

    return { transactionRequest, gasFallbackUsed }
  }, [
    address,
    chainId,
    currencyAmountIn,
    gasFallbackUsed,
    permit2InfoLoading,
    permit2Signature,
    permitInfo,
    permitInfoLoading,
    shouldFetchSimulatedGasLimit,
    simulatedGasLimit,
    simulatedGasLimitLoading,
    tokenApprovalInfo,
    trade,
    permit2Enabled,
    wrapType,
  ])
}

interface SwapTxAndGasInfo {
  txRequest?: providers.TransactionRequest
  approveTxRequest?: providers.TransactionRequest
  totalGasFee?: string
  gasFallbackUsed: boolean
  isLoading: boolean
}

export function useSwapTxAndGasInfo(
  derivedSwapInfo: DerivedSwapInfo,
  skipGasFeeQuery: boolean
): SwapTxAndGasInfo {
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo(
    chainId,
    wrapType,
    currencyAmounts[CurrencyField.INPUT]
  )

  const { transactionRequest, gasFallbackUsed } = useTransactionRequestInfo(
    derivedSwapInfo,
    tokenApprovalInfo
  )

  const approveFeeInfo = useTransactionGasFee(
    tokenApprovalInfo?.txRequest,
    GasSpeed.Urgent,
    skipGasFeeQuery
  )
  const txFeeInfo = useTransactionGasFee(transactionRequest, GasSpeed.Urgent, skipGasFeeQuery)
  const totalGasFee = sumGasFees(approveFeeInfo?.gasFee, txFeeInfo?.gasFee)

  const txRequestWithGasSettings = useMemo(() => {
    if (!transactionRequest || !txFeeInfo) return

    return { ...transactionRequest, ...txFeeInfo.params }
  }, [transactionRequest, txFeeInfo])

  const approveLoading =
    !tokenApprovalInfo || Boolean(tokenApprovalInfo.txRequest && !approveFeeInfo)

  const approveTxWithGasSettings: providers.TransactionRequest | undefined = useMemo(() => {
    if (approveLoading || !tokenApprovalInfo?.txRequest) return

    return { ...tokenApprovalInfo.txRequest, ...approveFeeInfo?.params }
  }, [approveLoading, tokenApprovalInfo?.txRequest, approveFeeInfo?.params])

  return {
    txRequest: txRequestWithGasSettings,
    approveTxRequest: approveTxWithGasSettings,
    totalGasFee,
    gasFallbackUsed,
    isLoading: approveLoading,
  }
}

/** Callback to submit trades and track progress */
export function useSwapCallback(
  approveTxRequest: providers.TransactionRequest | undefined,
  swapTxRequest: providers.TransactionRequest | undefined,
  totalGasFee: string | undefined,
  trade: Trade | null | undefined,
  currencyInAmountUSD: NullUndefined<CurrencyAmount<Currency>>,
  currencyOutAmountUSD: NullUndefined<CurrencyAmount<Currency>>,
  isAutoSlippage: boolean,
  onSubmit: () => void,
  txId?: string
): () => void {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  return useMemo(() => {
    if (!account || !swapTxRequest || !trade || !totalGasFee) {
      return () => {
        logger.error('hooks', 'useSwapCallback', 'Missing swapTx')
      }
    }

    return () => {
      appDispatch(
        swapActions.trigger({
          txId,
          account,
          trade,
          currencyInAmountUSD,
          currencyOutAmountUSD,
          approveTxRequest,
          swapTxRequest,
        })
      )
      onSubmit()

      sendAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, {
        ...getBaseTradeAnalyticsProperties(trade),
        estimated_network_fee_wei: totalGasFee,
        gas_limit: toStringish(swapTxRequest.gasLimit),
        token_in_amount_usd: currencyInAmountUSD
          ? parseFloat(currencyInAmountUSD.toFixed(2))
          : undefined,
        token_out_amount_usd: currencyOutAmountUSD
          ? parseFloat(currencyOutAmountUSD.toFixed(2))
          : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: trade.quote?.blockNumber,
        is_auto_slippage: isAutoSlippage,
      })
    }
  }, [
    account,
    swapTxRequest,
    trade,
    totalGasFee,
    currencyInAmountUSD,
    currencyOutAmountUSD,
    appDispatch,
    txId,
    approveTxRequest,
    onSubmit,
    isAutoSlippage,
  ])
}

export function useWrapCallback(
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined,
  wrapType: WrapType,
  onSuccess: () => void,
  txRequest?: providers.TransactionRequest,
  txId?: string
): {
  wrapCallback: () => void
} {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  return useMemo(() => {
    if (!isWrapAction(wrapType)) {
      return {
        wrapCallback: (): void =>
          logger.error('hooks', 'useWrapCallback', 'Wrap callback invoked for non-wrap actions'),
      }
    }

    if (!account || !inputCurrencyAmount || !txRequest) {
      return {
        wrapCallback: (): void =>
          logger.error(
            'hooks',
            'useWrapCallback',
            'Wrap callback invoked without active account, input currency or valid transaction request'
          ),
      }
    }

    return {
      wrapCallback: (): void => {
        appDispatch(
          tokenWrapActions.trigger({
            account,
            inputCurrencyAmount,
            txId,
            txRequest,
          })
        )
        onSuccess()
      },
    }
  }, [txId, account, appDispatch, inputCurrencyAmount, wrapType, txRequest, onSuccess])
}

// The first trade shown to the user is implicitly accepted but every subsequent update to
// the trade params require an explicit user approval
export function useAcceptedTrade(trade: NullUndefined<Trade>): {
  onAcceptTrade: () => undefined
  acceptedTrade: Trade<Currency, Currency, TradeType> | undefined
} {
  const [latestTradeAccepted, setLatestTradeAccepted] = useState<boolean>(false)
  const prevTradeRef = useRef<Trade>()
  useEffect(() => {
    if (latestTradeAccepted) setLatestTradeAccepted(false)
    if (!prevTradeRef.current) prevTradeRef.current = trade ?? undefined
  }, [latestTradeAccepted, trade])

  const acceptedTrade = prevTradeRef.current ?? trade ?? undefined

  const onAcceptTrade = (): undefined => {
    if (!trade) return undefined
    setLatestTradeAccepted(true)
    prevTradeRef.current = trade
  }

  return { onAcceptTrade, acceptedTrade }
}

export function useShowSwapNetworkNotification(chainId?: ChainId): void {
  const prevChainId = usePrevious(chainId)
  const appDispatch = useAppDispatch()
  useEffect(() => {
    // don't fire notification toast for first network selection
    if (!prevChainId || !chainId || prevChainId === chainId) return

    appDispatch(
      pushNotification({ type: AppNotificationType.SwapNetwork, chainId, hideDelay: 2000 })
    )
  }, [chainId, prevChainId, appDispatch])
}
