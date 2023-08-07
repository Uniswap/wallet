import { providers } from 'ethers'
import { sendTransaction } from 'src/features/transactions/sendTransactionSaga'
import { tradeToTransactionInfo } from 'src/features/transactions/swap/utils'
import { call } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import { TransactionType, TransactionTypeInfo } from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { createMonitoredSaga } from 'wallet/src/utils/saga'
import serializeError from 'wallet/src/utils/serializeError'

export type SwapParams = {
  txId?: string
  account: Account
  trade: Trade
  approveTxRequest?: providers.TransactionRequest
  swapTxRequest: providers.TransactionRequest
}

export function* approveAndSwap(params: SwapParams) {
  try {
    const { account, approveTxRequest, swapTxRequest, txId, trade } = params
    if (!swapTxRequest.chainId || !swapTxRequest.to || (approveTxRequest && !approveTxRequest.to)) {
      throw new Error('approveAndSwap received incomplete transaction request details')
    }

    const { chainId } = swapTxRequest
    const provider = yield* call(getProvider, chainId)
    const nonce = yield* call([provider, provider.getTransactionCount], account.address, 'pending')

    if (approveTxRequest && approveTxRequest.to) {
      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Approve,
        tokenAddress: approveTxRequest.to,
        spender: swapTxRequest.to,
      }

      yield* call(sendTransaction, {
        chainId,
        account,
        options: { request: approveTxRequest },
        typeInfo,
        trade,
      })
    }

    const request = {
      ...swapTxRequest,
      nonce: approveTxRequest ? nonce + 1 : undefined,
    }

    const swapTypeInfo = tradeToTransactionInfo(trade)
    yield* call(sendTransaction, {
      txId,
      chainId,
      account,
      options: { request },
      typeInfo: swapTypeInfo,
      trade,
    })
  } catch (error) {
    logger.error('Swap failed', {
      tags: {
        file: 'swapSaga',
        function: 'approveAndSwap',
        error: serializeError(error),
      },
    })
  }
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga<SwapParams>(approveAndSwap, 'swap')
