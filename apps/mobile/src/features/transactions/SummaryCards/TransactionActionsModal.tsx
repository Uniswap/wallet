import dayjs from 'dayjs'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModalContent, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType, CopyNotificationType } from 'src/features/notifications/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { TransactionDetails, TransactionType } from 'src/features/transactions/types'
import { Theme } from 'src/styles/theme'
import { setClipboard } from 'src/utils/clipboard'
import { openMoonpayHelpLink, openUniswapHelpLink } from 'src/utils/linking'

function renderOptionItem(
  label: string,
  textColorOverride?: keyof Theme['colors']
): () => JSX.Element {
  return (): JSX.Element => (
    <>
      <Separator />
      <Text
        color={textColorOverride ?? 'textPrimary'}
        p="spacing16"
        textAlign="center"
        variant="bodyLarge">
        {label}
      </Text>
    </>
  )
}

interface TransactionActionModalProps {
  onExplore: () => void
  onViewMoonpay?: () => void
  onClose: () => void
  onCancel: () => void
  msTimestampAdded: number
  showCancelButton?: boolean
  transactionDetails: TransactionDetails
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  msTimestampAdded,
  onCancel,
  onClose,
  onExplore,
  onViewMoonpay,
  showCancelButton,
  transactionDetails,
}: TransactionActionModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const dateString = dayjs(msTimestampAdded).format('MMMM D, YYYY')

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const options = useMemo(() => {
    const isFiatOnRampTransaction =
      transactionDetails.typeInfo.type === TransactionType.FiatPurchase

    const maybeViewOnMoonpayOption = onViewMoonpay
      ? [
          {
            key: ElementName.MoonpayExplorerView,
            onPress: onViewMoonpay,
            render: renderOptionItem(t('View on MoonPay')),
          },
        ]
      : []

    const maybeViewOnEtherscanOption = transactionDetails.hash
      ? [
          {
            key: ElementName.EtherscanView,
            onPress: onExplore,
            render: renderOptionItem(t('View on Etherscan')),
          },
        ]
      : []

    const transactionId =
      // isFiatOnRampTransaction would not provide type narrowing here
      transactionDetails.typeInfo.type === TransactionType.FiatPurchase
        ? transactionDetails.typeInfo.id
        : transactionDetails.hash

    const maybeCopyTransactionIdOption = transactionId
      ? [
          {
            key: ElementName.Copy,
            onPress: (): void => {
              setClipboard(transactionId)
              dispatch(
                pushNotification({
                  type: AppNotificationType.Copied,
                  copyType: CopyNotificationType.TransactionId,
                })
              )
              handleClose()
            },
            render: onViewMoonpay
              ? renderOptionItem(t('Copy MoonPay transaction ID'))
              : renderOptionItem(t('Copy transaction ID')),
          },
        ]
      : []

    const transactionActionOptions: MenuItemProp[] = [
      ...maybeViewOnMoonpayOption,
      ...maybeViewOnEtherscanOption,
      ...maybeCopyTransactionIdOption,
      {
        key: ElementName.GetHelp,
        onPress: (): void => {
          if (isFiatOnRampTransaction) {
            openMoonpayHelpLink()
          } else {
            openUniswapHelpLink()
          }

          handleClose()
        },
        render: renderOptionItem(t('Get help')),
      },
    ]
    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: onCancel,
        render: renderOptionItem(t('Cancel transaction'), 'accentCritical'),
      })
    }
    return transactionActionOptions
  }, [
    transactionDetails.typeInfo,
    transactionDetails.hash,
    onViewMoonpay,
    t,
    onExplore,
    showCancelButton,
    dispatch,
    handleClose,
    onCancel,
  ])

  return (
    <BottomSheetModal
      hideHandlebar
      backgroundColor="accentCritical"
      name={ModalName.TransactionActions}
      onClose={handleClose}>
      <Flex pb="spacing24" px="spacing12">
        <ActionSheetModalContent
          header={
            <Text color="textTertiary" p="spacing16" variant="bodySmall">
              {t('Submitted on') + ' ' + dateString}
            </Text>
          }
          options={options}
          onClose={handleClose}
        />
      </Flex>
    </BottomSheetModal>
  )
}
