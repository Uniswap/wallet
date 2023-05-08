import { providers } from 'ethers'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'src/features/transactions/transfer/hooks'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { currencyAddress } from 'src/utils/currencyId'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'src/utils/format'

interface TransferFormProps {
  derivedTransferInfo: DerivedTransferInfo
  txRequest?: providers.TransactionRequest
  totalGasFee?: string
  onNext: () => void
  onPrev: () => void
  warnings: Warning[]
}

export function TransferReview({
  derivedTransferInfo,
  totalGasFee,
  onNext,
  onPrev,
  txRequest,
  warnings,
}: TransferFormProps): JSX.Element | null {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)

  const onShowWarning = useCallback(() => {
    setShowWarningModal(true)
  }, [])

  const onCloseWarning = useCallback(() => {
    setShowWarningModal(false)
  }, [])

  const {
    currencyAmounts,
    recipient,
    isUSDInput = false,
    currencyInInfo,
    nftIn,
    chainId,
    txId,
    exactAmountUSD,
  } = derivedTransferInfo

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )

  const actionButtonDisabled =
    blockingWarning || !totalGasFee || !txRequest || account.type === AccountType.Readonly

  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyInInfo ? currencyAddress(currencyInInfo.currency) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onNext
  )

  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.nftContract?.address,
    nftIn?.tokenId,
    txRequest,
    onNext
  )

  const submitCallback = (): void => {
    onNext()
    nftIn ? transferNFTCallback?.() : transferERC20Callback?.()
  }

  if (!recipient) return null

  const actionButtonProps = {
    disabled: actionButtonDisabled,
    label: t('Send'),
    name: ElementName.Send,
    onPress: submitCallback,
  }

  const transferWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  const formattedCurrencyAmount = formatCurrencyAmount(
    currencyAmounts[CurrencyField.INPUT],
    NumberType.TokenTx
  )
  const formattedAmountIn = isUSDInput
    ? formatNumberOrString(exactAmountUSD, NumberType.FiatTokenQuantity)
    : formattedCurrencyAmount

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          closeText={blockingWarning ? undefined : t('Cancel')}
          confirmText={blockingWarning ? t('OK') : t('Confirm')}
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onCancel={onCloseWarning}
          onClose={onCloseWarning}
          onConfirm={onCloseWarning}
        />
      )}
      <TransactionReview
        actionButtonProps={actionButtonProps}
        currencyInInfo={currencyInInfo}
        formattedAmountIn={formattedAmountIn}
        inputCurrencyUSDValue={inputCurrencyUSDValue}
        isUSDInput={isUSDInput}
        nftIn={nftIn}
        recipient={recipient}
        transactionDetails={
          <TransactionDetails
            chainId={chainId}
            gasFee={totalGasFee}
            showWarning={Boolean(transferWarning)}
            warning={transferWarning}
            onShowWarning={onShowWarning}
          />
        }
        usdTokenEquivalentAmount={formattedCurrencyAmount}
        onPrev={onPrev}
      />
    </>
  )
}
