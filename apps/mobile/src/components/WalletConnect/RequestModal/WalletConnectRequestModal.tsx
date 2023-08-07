import { useNetInfo } from '@react-native-community/netinfo'
import { getSdkError } from '@walletconnect/utils'
import { providers } from 'ethers'
import React, { PropsWithChildren, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { NetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ClientDetails, PermitInfo } from 'src/components/WalletConnect/RequestModal/ClientDetails'
import { useHasSufficientFunds } from 'src/components/WalletConnect/RequestModal/hooks'
import { RequestDetails } from 'src/components/WalletConnect/RequestModal/RequestDetails'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { signWcRequestActions } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { rejectRequest, returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import {
  isTransactionRequest,
  SignRequest,
  TransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasSpeed } from 'wallet/src/features/gas/types'
import { logger } from 'wallet/src/features/logger/logger'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { useIsBlocked } from 'wallet/src/features/trm/hooks'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import {
  EthMethod,
  isPrimaryTypePermit,
  WCEventType,
  WCRequestOutcome,
} from 'wallet/src/features/walletConnect/types'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import serializeError from 'wallet/src/utils/serializeError'

const MAX_MODAL_MESSAGE_HEIGHT = 200

interface Props {
  onClose: () => void
  request: SignRequest | TransactionRequest
}

const isPotentiallyUnsafe = (request: WalletConnectRequest): boolean =>
  request.type !== EthMethod.PersonalSign

const methodCostsGas = (request: WalletConnectRequest): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction

/** If the request is a permit then parse the relevant information otherwise return undefined. */
const getPermitInfo = (request: WalletConnectRequest): PermitInfo | undefined => {
  if (request.type !== EthMethod.SignTypedDataV4) {
    return undefined
  }

  try {
    const message = JSON.parse(request.rawMessage)
    if (!isPrimaryTypePermit(message)) {
      return undefined
    }

    const { domain, message: permitPayload } = message
    const currencyId = buildCurrencyId(domain.chainId, domain.verifyingContract)
    const amount = permitPayload.value

    return { currencyId, amount }
  } catch (error) {
    logger.error('Invalid WalletConnect permit info', {
      tags: {
        file: 'WalletConnectRequestModal',
        function: 'getPermitInfo',
        error: serializeError(error),
      },
    })
    return undefined
  }
}

const VALID_REQUEST_TYPES = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
  EthMethod.EthSendTransaction,
]

function SectionContainer({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>): JSX.Element | null {
  return children ? (
    <Box p="spacing16" style={style}>
      {children}
    </Box>
  ) : null
}

const spacerProps: BoxProps = {
  borderBottomColor: 'background1',
  borderBottomWidth: 1,
}

export function WalletConnectRequestModal({ onClose, request }: Props): JSX.Element | null {
  const theme = useAppTheme()
  const netInfo = useNetInfo()
  const didOpenFromDeepLink = useAppSelector(selectDidOpenFromDeepLink)
  const chainId = request.chainId

  const tx: providers.TransactionRequest | null = useMemo(() => {
    if (!isTransactionRequest(request)) {
      return null
    }

    return { ...request.transaction, chainId }
  }, [chainId, request])

  const signerAccounts = useSignerAccounts()
  const signerAccount = signerAccounts.find((account) =>
    areAddressesEqual(account.address, request.account)
  )
  const gasFeeInfo = useTransactionGasFee(tx, GasSpeed.Urgent)
  const hasSufficientFunds = useHasSufficientFunds({
    account: request.account,
    chainId,
    gasFeeInfo,
    value: isTransactionRequest(request) ? request.transaction.value : undefined,
  })

  const { isBlocked, isBlockedLoading } = useIsBlocked(request.account)

  const checkConfirmEnabled = (): boolean => {
    if (!netInfo.isInternetReachable) return false

    if (!signerAccount) return false

    if (isBlocked || isBlockedLoading) return false

    if (methodCostsGas(request)) return !!(tx && hasSufficientFunds && gasFeeInfo)

    if (isTransactionRequest(request)) return !!tx

    return true
  }

  const confirmEnabled = checkConfirmEnabled()

  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  /**
   * TODO: [MOB-239] implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  const onReject = async (): Promise<void> => {
    if (request.version === '1') {
      rejectRequest(request.internalId)
    } else {
      await wcWeb3Wallet.respondSessionRequest({
        topic: request.sessionId,
        response: {
          id: Number(request.internalId),
          jsonrpc: '2.0',
          error: getSdkError('USER_REJECTED'),
        },
      })
    }

    rejectOnCloseRef.current = false

    sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
      request_type: isTransactionRequest(request)
        ? WCEventType.TransactionRequest
        : WCEventType.SignRequest,
      eth_method: request.type,
      dapp_url: request.dapp.url,
      dapp_name: request.dapp.name,
      chain_id: chainId,
      outcome: WCRequestOutcome.Reject,
      wc_version: request.version,
    })

    onClose()
    if (didOpenFromDeepLink) {
      returnToPreviousApp()
    }
  }

  const onConfirm = async (): Promise<void> => {
    if (!confirmEnabled || !signerAccount) return
    if (request.type === EthMethod.EthSendTransaction) {
      if (!gasFeeInfo) return // appeasing typescript
      dispatch(
        signWcRequestActions.trigger({
          sessionId: request.sessionId,
          requestInternalId: request.internalId,
          method: request.type,
          transaction: { ...tx, ...gasFeeInfo.params },
          account: signerAccount,
          dapp: request.dapp,
          chainId,
          version: request.version,
        })
      )
    } else {
      dispatch(
        signWcRequestActions.trigger({
          sessionId: request.sessionId,
          requestInternalId: request.internalId,
          // this is EthSignMessage type
          method: request.type,
          message: request.message || request.rawMessage,
          account: signerAccount,
          dapp: request.dapp,
          chainId,
          version: request.version,
        })
      )
    }

    rejectOnCloseRef.current = false

    sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
      request_type: isTransactionRequest(request)
        ? WCEventType.TransactionRequest
        : WCEventType.SignRequest,
      eth_method: request.type,
      dapp_url: request.dapp.url,
      dapp_name: request.dapp.name,
      chain_id: chainId,
      outcome: WCRequestOutcome.Confirm,
      wc_version: request.version,
    })

    onClose()
    if (didOpenFromDeepLink) {
      returnToPreviousApp()
    }
  }

  const { trigger: actionButtonTrigger } = useBiometricPrompt(onConfirm)
  const { requiredForTransactions } = useBiometricAppSettings()

  if (!VALID_REQUEST_TYPES.includes(request.type)) {
    return null
  }

  const handleClose = async (): Promise<void> => {
    if (rejectOnCloseRef.current) {
      await onReject()
    } else {
      onClose()
    }
  }

  const nativeCurrency = chainId && NativeCurrency.onChain(chainId)
  const permitInfo = getPermitInfo(request)

  return (
    <BottomSheetModal name={ModalName.WCSignRequest} onClose={handleClose}>
      <Flex gap="spacing24" paddingBottom="spacing48" paddingHorizontal="spacing16" pt="spacing36">
        <ClientDetails permitInfo={permitInfo} request={request} />
        <Flex gap="spacing12">
          <Flex
            backgroundColor="background2"
            borderRadius="rounded16"
            gap="none"
            spacerProps={spacerProps}>
            {!permitInfo && (
              <SectionContainer style={requestMessageStyle}>
                <Flex gap="spacing12">
                  <RequestDetails request={request} />
                </Flex>
              </SectionContainer>
            )}
            <Box px="spacing16" py="spacing12">
              {methodCostsGas(request) ? (
                <NetworkFee chainId={chainId} gasFee={gasFeeInfo?.gasFee} />
              ) : (
                <Flex row alignItems="center" justifyContent="space-between">
                  <Text color="textPrimary" variant="subheadSmall">
                    {t('Network')}
                  </Text>
                  <NetworkPill
                    showIcon
                    chainId={chainId}
                    gap="spacing4"
                    pl="spacing4"
                    pr="spacing8"
                    py="spacing2"
                    textVariant="subheadSmall"
                  />
                </Flex>
              )}
            </Box>

            <SectionContainer>
              <AccountDetails address={request.account} />
              {!hasSufficientFunds && (
                <Text color="accentWarning" paddingTop="spacing8" variant="bodySmall">
                  {t("You don't have enough {{symbol}} to complete this transaction.", {
                    symbol: nativeCurrency?.symbol,
                  })}
                </Text>
              )}
            </SectionContainer>
          </Flex>
          {!netInfo.isInternetReachable ? (
            <BaseCard.InlineErrorState
              backgroundColor="accentWarningSoft"
              icon={
                <AlertTriangle
                  color={theme.colors.accentWarning}
                  height={theme.iconSizes.icon16}
                  width={theme.iconSizes.icon16}
                />
              }
              textColor="accentWarning"
              title={t('Internet or network connection error')}
            />
          ) : (
            <WarningSection
              isBlockedAddress={isBlocked}
              request={request}
              showUnsafeWarning={isPotentiallyUnsafe(request)}
            />
          )}
          <Flex row gap="spacing12">
            <Button
              fill
              emphasis={ButtonEmphasis.Tertiary}
              label={t('Cancel')}
              size={ButtonSize.Medium}
              testID={ElementName.Cancel}
              onPress={onReject}
            />
            <Button
              fill
              disabled={!confirmEnabled}
              label={isTransactionRequest(request) ? t('Accept') : t('Sign')}
              size={ButtonSize.Medium}
              testID={ElementName.Confirm}
              onPress={async (): Promise<void> => {
                if (requiredForTransactions) {
                  await actionButtonTrigger()
                } else {
                  await onConfirm()
                }
              }}
            />
          </Flex>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function WarningSection({
  request,
  showUnsafeWarning,
  isBlockedAddress,
}: {
  request: WalletConnectRequest
  showUnsafeWarning: boolean
  isBlockedAddress: boolean
}): JSX.Element | null {
  const theme = useAppTheme()
  const { t } = useTranslation()

  if (!showUnsafeWarning && !isBlockedAddress) return null

  if (isBlockedAddress) {
    return <BlockedAddressWarning centered row alignSelf="center" />
  }

  return (
    <Flex centered row alignSelf="center" gap="spacing8">
      <AlertTriangle
        color={theme.colors.accentWarning}
        height={iconSizes.icon16}
        width={iconSizes.icon16}
      />
      <Text color="textSecondary" fontStyle="italic" variant="bodyMicro">
        {t('Be careful: this {{ requestType }} may transfer assets', {
          requestType: isTransactionRequest(request) ? 'transaction' : 'message',
        })}
      </Text>
    </Flex>
  )
}

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}
