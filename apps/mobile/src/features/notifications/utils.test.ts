import { TradeType } from '@uniswap/sdk-core'
import { createFinalizedTxAction } from 'src/features/notifications/notificationWatcherSaga.test'
import {
  buildReceiveNotification,
  createBalanceUpdate,
  formSwapNotificationTitle,
} from 'src/features/notifications/utils'
import { account } from 'src/test/fixtures'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI, USDC } from 'wallet/src/constants/tokens'
import { AssetType } from 'wallet/src/entities/assets'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  NFTTradeType,
  ReceiveTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { SAMPLE_SEED_ADDRESS_1 } from 'wallet/src/test/fixtures'

describe(formSwapNotificationTitle, () => {
  it('formats successful swap title', () => {
    expect(
      formSwapNotificationTitle(
        TransactionStatus.Success,
        TradeType.EXACT_INPUT,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000'
      )
    ).toEqual('Swapped 1.00 DAI for ~1.00 USDC.')
  })

  it('formats canceled swap title', () => {
    expect(
      formSwapNotificationTitle(
        TransactionStatus.Cancelled,
        TradeType.EXACT_INPUT,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000'
      )
    ).toEqual('Canceled DAI-USDC swap.')
  })

  it('formats failed swap title', () => {
    expect(
      formSwapNotificationTitle(
        TransactionStatus.Failed,
        TradeType.EXACT_INPUT,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000'
      )
    ).toEqual('Failed to swap 1.00 DAI for ~1.00 USDC.')
  })
})

describe(createBalanceUpdate, () => {
  it('handles unconfirmed transactions', () => {
    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Approve,
        transactionStatus: TransactionStatus.Cancelled,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
      })
    ).toBeUndefined()

    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Approve,
        transactionStatus: TransactionStatus.Failed,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
      })
    ).toBeUndefined()
  })

  it('handles balance increase', () => {
    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Receive,
        transactionStatus: TransactionStatus.Success,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '+1.00 DAI',
      usdValueChange: '$1.00',
    })
  })

  it('handles balance decrease', () => {
    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Send,
        transactionStatus: TransactionStatus.Success,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '-1.00 DAI',
      usdValueChange: '$1.00',
    })

    expect(
      createBalanceUpdate({
        transactionType: TransactionType.NFTMint,
        transactionStatus: TransactionStatus.Success,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '-1.00 DAI',
      usdValueChange: '$1.00',
    })

    expect(
      createBalanceUpdate({
        transactionType: TransactionType.NFTTrade,
        transactionStatus: TransactionStatus.Success,
        nftTradeType: NFTTradeType.BUY,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '-1.00 DAI',
      usdValueChange: '$1.00',
    })
  })
})

const receiveCurrencyTypeInfo: ReceiveTokenTransactionInfo = {
  type: TransactionType.Receive,
  assetType: AssetType.Currency,
  currencyAmountRaw: '1000',
  sender: '0x000123abc456def',
  tokenAddress: '0xUniswapToken',
}

const receiveNftTypeInfo: ReceiveTokenTransactionInfo = {
  type: TransactionType.Receive,
  assetType: AssetType.ERC1155,
  sender: '0x000123abc456def',
  tokenAddress: '0xUniswapToken',
  tokenId: '420',
}

describe(buildReceiveNotification, () => {
  it('returns undefined if not successful status', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.status = TransactionStatus.Failed // overwite status to incorrect status

    expect(buildReceiveNotification(testTransaction, account.address)).toBeUndefined()
  })

  it('returns undefined if not receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.typeInfo.type = TransactionType.Send // overwite type to incorrect  type

    expect(buildReceiveNotification(testTransaction, account.address)).toBeUndefined()
  })

  it('builds correct notification object for nft receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveNftTypeInfo)

    expect(buildReceiveNotification(testTransaction, account.address)).toEqual({
      address: SAMPLE_SEED_ADDRESS_1,
      assetType: AssetType.ERC1155,
      chainId: ChainId.Mainnet,
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
      tokenId: '420',
      txHash: '0x123',
      txId: 'uuid-4',
      txStatus: TransactionStatus.Success,
      txType: TransactionType.Receive,
      type: AppNotificationType.Transaction,
    })
  })

  it('builds correct notification object for currency receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.typeInfo.type = TransactionType.Receive // overwrite to correct txn type (default is send)

    expect(buildReceiveNotification(testTransaction, account.address)).toEqual({
      address: SAMPLE_SEED_ADDRESS_1,
      assetType: AssetType.Currency,
      chainId: ChainId.Mainnet,
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
      txHash: '0x123',
      txId: 'uuid-4',
      txStatus: TransactionStatus.Success,
      txType: TransactionType.Receive,
      type: AppNotificationType.Transaction,
      currencyAmountRaw: '1000',
    })
  })
})
