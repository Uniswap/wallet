import { Currency, TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { transactionActions } from 'src/features/transactions/slice'
import {
  createTransactionId,
  getSerializableTransactionRequest,
} from 'src/features/transactions/utils'
import { call, put } from 'typed-redux-saga'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { logger } from 'wallet/src/features/logger/logger'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { getCurrencyAddressForAnalytics } from 'wallet/src/utils/currencyId'
import { formatCurrencyAmount, NumberType } from 'wallet/src/utils/format'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'

export interface SendTransactionParams {
  // internal id used for tracking transactions before theyre submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: ChainId
  account: Account
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  trade?: Trade<Currency, Currency, TradeType>
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

export function* sendTransaction(params: SendTransactionParams) {
  const { chainId, account, options } = params
  const request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) throw new Error('Account must support signing')

  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId)

  const signerManager = yield* call(getSignerManager)
  const { transactionResponse, populatedRequest } = yield* call(
    signAndSendTransaction,
    request,
    account,
    provider,
    signerManager
  )
  logger.debug('sendTransaction', '', 'Tx submitted:', transactionResponse.hash)

  // Register the tx in the store
  yield* call(addTransaction, params, transactionResponse.hash, populatedRequest)
  return { transactionResponse }
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: Account,
  provider: providers.Provider,
  signerManager: SignerManager
): Promise<{
  transactionResponse: providers.TransactionResponse
  populatedRequest: providers.TransactionRequest
}> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

function* addTransaction(
  { chainId, typeInfo, account, options, txId, trade }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest
) {
  const id = txId ?? createTransactionId()
  const request = getSerializableTransactionRequest(populatedRequest, chainId)

  const transaction: TransactionDetails = {
    id,
    chainId,
    hash,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
      request,
    },
  }

  if (transaction.typeInfo.type === TransactionType.Swap && trade) {
    yield* call(sendAnalyticsEvent, MobileEventName.SwapSubmitted, {
      transaction_hash: hash,
      chain_id: chainId,
      price_impact_basis_points: trade.priceImpact.multiply(100).toSignificant(),
      token_in_amount: trade.inputAmount.toExact(),
      token_out_amount: formatCurrencyAmount(trade.outputAmount, NumberType.SwapTradeAmount),
      token_in_symbol: trade.inputAmount.currency.symbol,
      token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
      token_out_symbol: trade.outputAmount.currency.symbol,
      token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    })
  }
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('sendTransaction', 'addTransaction', 'Tx added:', { chainId, ...typeInfo })
}
