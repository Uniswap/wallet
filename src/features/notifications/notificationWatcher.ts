import { CallEffect, ForkEffect, PutEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'
import { buildReceiveNotification } from 'src/features/notifications/utils'
import { selectTransactions } from 'src/features/transactions/selectors'
import { finalizeTransaction } from 'src/features/transactions/slice'
import { TransactionType } from 'src/features/transactions/types'
import { getInputAmountFromTrade, getOutputAmountFromTrade } from 'src/features/transactions/utils'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { call, put, takeLatest } from 'typed-redux-saga'

export function* notificationWatcher(): Generator<ForkEffect<never>, void, unknown> {
  yield* takeLatest(finalizeTransaction.type, pushTransactionNotification)
}

export function* pushTransactionNotification(
  action: ReturnType<typeof finalizeTransaction>
): Generator<
  | PutEffect<{
      payload: AppNotification
      type: string
    }>
  | CallEffect<boolean>,
  void,
  unknown
> {
  const { chainId, status, typeInfo, hash, id, from, addedTime } = action.payload

  const baseNotificationData = {
    txStatus: status,
    chainId,
    txHash: hash,
    address: from,
    txId: id,
  }

  if (typeInfo.type === TransactionType.Approve) {
    const shouldSuppressNotification = yield* call(
      suppressApproveNotification,
      from,
      chainId,
      addedTime
    )
    if (!shouldSuppressNotification) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Approve,
          tokenAddress: typeInfo.tokenAddress,
          spender: typeInfo.spender,
        })
      )
    }
  } else if (typeInfo.type === TransactionType.Swap) {
    const inputCurrencyAmountRaw = getInputAmountFromTrade(typeInfo)
    const outputCurrencyAmountRaw = getOutputAmountFromTrade(typeInfo)
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Swap,
        inputCurrencyId: typeInfo.inputCurrencyId,
        outputCurrencyId: typeInfo.outputCurrencyId,
        inputCurrencyAmountRaw,
        outputCurrencyAmountRaw,
        tradeType: typeInfo.tradeType,
      })
    )
  } else if (typeInfo.type === TransactionType.Wrap) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Wrap,
        currencyAmountRaw: typeInfo.currencyAmountRaw,
        unwrapped: typeInfo.unwrapped,
      })
    )
  } else if (typeInfo.type === TransactionType.Send) {
    if (typeInfo?.assetType === AssetType.Currency && typeInfo?.currencyAmountRaw) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: typeInfo.assetType,
          tokenAddress: typeInfo.tokenAddress,
          currencyAmountRaw: typeInfo.currencyAmountRaw,
          recipient: typeInfo.recipient,
        })
      )
    } else if (
      (typeInfo?.assetType === AssetType.ERC1155 || typeInfo?.assetType === AssetType.ERC721) &&
      typeInfo?.tokenId
    ) {
      yield* put(
        pushNotification({
          ...baseNotificationData,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: typeInfo.assetType,
          tokenAddress: typeInfo.tokenAddress,
          tokenId: typeInfo.tokenId,
          recipient: typeInfo.recipient,
        })
      )
    }
  } else if (typeInfo.type === TransactionType.Receive) {
    const receiveNotification = buildReceiveNotification(action.payload, from)
    if (receiveNotification) {
      yield* put(pushNotification(receiveNotification))
    }
  } else if (typeInfo.type === TransactionType.WCConfirm) {
    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        event: WalletConnectEvent.TransactionConfirmed,
        dappName: typeInfo.dapp.name,
        imageUrl: typeInfo.dapp.icon,
        chainId: typeInfo.dapp.chain_id,
      })
    )
  } else if (typeInfo.type === TransactionType.Unknown) {
    yield* put(
      pushNotification({
        ...baseNotificationData,
        type: AppNotificationType.Transaction,
        txType: TransactionType.Unknown,
        tokenAddress: typeInfo?.tokenAddress,
      })
    )
  }
}

// If an approve tx is submitted with a swap tx (i.e, swap tx is added within 3 seconds of an approve tx),
// then suppress the approve notification
function* suppressApproveNotification(
  address: Address,
  chainId: ChainId,
  approveAddedTime: number
): Generator<SelectEffect, boolean, unknown> {
  const transactions = (yield* appSelect(selectTransactions))?.[address]?.[chainId]
  const transactionDetails = Object.values(transactions ?? {})
  const foundSwapTx = transactionDetails.find((tx) => {
    const { type } = tx.typeInfo
    if (type !== TransactionType.Swap) {
      return false
    }

    const swapAddedTime = tx.addedTime
    return swapAddedTime - approveAddedTime < 3000
  })

  return !!foundSwapTx
}
