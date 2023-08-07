import { MaxUint256 } from '@ethersproject/constants'
import { call } from '@redux-saga/core/effects'
import { TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { MethodParameters } from '@uniswap/v3-sdk'
import { expectSaga } from 'redux-saga-test-plan'
import { sendTransaction } from 'src/features/transactions/sendTransactionSaga'
import { approveAndSwap, SwapParams } from 'src/features/transactions/swap/swapSaga'
import { account, mockProvider } from 'src/test/fixtures'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI } from 'wallet/src/constants/tokens'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import {
  ExactInputSwapTransactionInfo,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { currencyId } from 'wallet/src/utils/currencyId'

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x01',
}

const CHAIN_ID = ChainId.Goerli
const universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(CHAIN_ID)

const transactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.Swap,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(NativeCurrency.onChain(CHAIN_ID)),
  outputCurrencyId: '0xabc',
  inputCurrencyAmountRaw: '10000',
  expectedOutputCurrencyAmountRaw: '200000',
  minimumOutputCurrencyAmountRaw: '300000',
}

const mockTrade = {
  inputAmount: { currency: new NativeCurrency(CHAIN_ID) },
  quote: { amount: MaxUint256, methodParameters },
} as unknown as Trade

const mockApproveTxRequest = {
  chainId: 1,
  to: DAI.address,
  data: '0x0',
}

const mockSwapTxRequest = {
  chainId: 1,
  to: universalRouterAddress,
  data: '0x0',
}

const swapParams: SwapParams = {
  txId: '1',
  account,
  trade: mockTrade,
  approveTxRequest: mockApproveTxRequest,
  swapTxRequest: mockSwapTxRequest,
}

const swapParamsWithoutApprove: SwapParams = {
  txId: '1',
  account,
  trade: mockTrade,
  approveTxRequest: undefined,
  swapTxRequest: mockSwapTxRequest,
}

const nonce = 1

describe(approveAndSwap, () => {
  it('sends a swap tx', async () => {
    await expectSaga(approveAndSwap, swapParamsWithoutApprove)
      .provide([
        [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
        [
          call(sendTransaction, {
            chainId: mockSwapTxRequest.chainId,
            account: swapParams.account,
            options: { request: mockSwapTxRequest },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
      ])
      .silentRun()
  })

  it('sends a swap tx with incremented nonce if an approve tx is sent first', async () => {
    await expectSaga(approveAndSwap, swapParams)
      .provide([
        [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
        [
          call(sendTransaction, {
            chainId: mockSwapTxRequest.chainId,
            account: swapParams.account,
            options: { request: mockApproveTxRequest },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
        [
          call(sendTransaction, {
            chainId: mockTrade.inputAmount.currency.chainId,
            account: swapParams.account,
            options: { request: { ...mockSwapTxRequest, nonce: nonce + 1 } },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
      ])
      .silentRun()
  })
})
