import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import { PendingConnectionSwitchAccountModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchAccountModal'
import { PendingConnectionSwitchNetworkModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchNetworkModal'
import { truncateDappName } from 'src/components/WalletConnect/ScanSheet/util'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { returnToPreviousApp, settlePendingSession } from 'src/features/walletConnect/WalletConnect'
import {
  addSession,
  removePendingSession,
  WalletConnectPendingSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import { getSessionNamespaces } from 'src/features/walletConnectV2/utils'
import Checkmark from 'ui/src/assets/icons/check.svg'
import X from 'ui/src/assets/icons/x.svg'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import {
  WalletConnectEvent,
  WCEventType,
  WCRequestOutcome,
} from 'wallet/src/features/walletConnect/types'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'

type Props = {
  pendingSession: WalletConnectPendingSession
  onClose: () => void
}

enum PendingConnectionModalState {
  Hidden,
  SwitchNetwork,
  SwitchAccount,
}

const SitePermissions = (): JSX.Element => {
  const theme = useAppTheme()
  const { t } = useTranslation()

  return (
    <Flex gap="spacing12" p="spacing16">
      <Text color="textSecondary" variant="subheadSmall">
        {t('App permissions')}
      </Text>
      <Flex row alignItems="flex-start" gap="spacing8">
        <Box mt="spacing2">
          <Checkmark color={theme.colors.accentSuccess} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="textPrimary" variant="bodySmall">
            {t('View your wallet address')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="flex-start" gap="spacing8">
        <Box mt="spacing2">
          <Checkmark color={theme.colors.accentSuccess} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="textPrimary" variant="bodySmall">
            {t('View your token balances')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="flex-start" gap="spacing8">
        <Box mt="spacing2">
          <X color={theme.colors.accentCritical} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="textPrimary" variant="bodySmall">
            {t('Transfer your assets without consent')}
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}

type SwitchNetworkProps = {
  selectedChainId: ChainId
  setModalState: (state: PendingConnectionModalState.SwitchNetwork) => void
}

const SwitchNetworkRow = ({ selectedChainId, setModalState }: SwitchNetworkProps): JSX.Element => {
  const theme = useAppTheme()

  const onPress = useCallback(() => {
    setModalState(PendingConnectionModalState.SwitchNetwork)
  }, [setModalState])

  return (
    <TouchableArea m="none" p="none" testID={ElementName.WCDappSwitchNetwork} onPress={onPress}>
      <Flex
        row
        shrink
        alignItems="center"
        gap="spacing12"
        justifyContent="space-between"
        p="spacing12">
        <Flex row shrink gap="spacing8">
          <NetworkLogo chainId={selectedChainId} />
          <Text color="textPrimary" variant="subheadSmall">
            {CHAIN_INFO[selectedChainId].label}
          </Text>
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" height="20" width="20" />
      </Flex>
    </TouchableArea>
  )
}

const NetworksRow = ({ chains }: { chains: ChainId[] }): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex
      row
      shrink
      alignItems="center"
      gap="spacing12"
      justifyContent="space-between"
      p="spacing12">
      <Flex grow row gap="spacing8" justifyContent="space-between">
        <Text color="textPrimary" variant="subheadSmall">
          {t('Networks')}
        </Text>
        <NetworkLogos chains={chains} />
      </Flex>
    </Flex>
  )
}

type SwitchAccountProps = {
  activeAddress: string
  setModalState: (state: PendingConnectionModalState.SwitchAccount) => void
}

const SwitchAccountRow = ({ activeAddress, setModalState }: SwitchAccountProps): JSX.Element => {
  const signerAccounts = useSignerAccounts()
  const accountIsSwitchable = signerAccounts.length > 1

  const onPress = useCallback(() => {
    setModalState(PendingConnectionModalState.SwitchAccount)
  }, [setModalState])

  return (
    <TouchableArea
      disabled={!accountIsSwitchable}
      m="none"
      p="spacing12"
      testID={ElementName.WCDappSwitchAccount}
      onPress={onPress}>
      <AccountDetails address={activeAddress} chevron={accountIsSwitchable} />
    </TouchableArea>
  )
}

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAddress = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const didOpenFromDeepLink = useAppSelector(selectDidOpenFromDeepLink)

  const [modalState, setModalState] = useState<PendingConnectionModalState>(
    PendingConnectionModalState.Hidden
  )
  const [selectedChainId, setSelectedChainId] = useState<ChainId>(ChainId.Mainnet)

  useEffect(() => {
    // Only WC v1.0 supports one chain per session
    if (pendingSession && pendingSession.version === '1') {
      const dappChain = toSupportedChainId(pendingSession.dapp.chain_id)
      if (dappChain) setSelectedChainId(dappChain)
    }
  }, [pendingSession])

  const onPressSettleConnection = useCallback(
    async (approved: boolean) => {
      sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
        request_type: WCEventType.SessionPending,
        dapp_url: pendingSession.dapp.url,
        dapp_name: pendingSession.dapp.name,
        wc_version: pendingSession.version,
        chain_id: pendingSession.version === '1' ? pendingSession.dapp.chain_id : undefined,
        outcome: approved ? WCRequestOutcome.Confirm : WCRequestOutcome.Reject,
      })

      // Handle WC 1.0 session request
      if (pendingSession.version === '1') {
        settlePendingSession(selectedChainId, activeAddress, approved)
        onClose()
        if (didOpenFromDeepLink) {
          returnToPreviousApp()
        }
        return
      }

      // Handle WC 2.0 session request
      if (approved) {
        const namespaces = getSessionNamespaces(activeAddress, pendingSession.proposalNamespaces)

        const session = await wcWeb3Wallet.approveSession({
          id: Number(pendingSession.id),
          namespaces,
        })

        dispatch(
          addSession({
            wcSession: {
              id: session.topic,
              dapp: {
                name: session.peer.metadata.name,
                url: session.peer.metadata.url,
                icon: session.peer.metadata.icons[0] ?? null,
                version: '2',
              },
              chains: pendingSession.chains,
              namespaces,
              version: '2',
            },
            account: activeAddress,
          })
        )

        dispatch(
          pushNotification({
            type: AppNotificationType.WalletConnect,
            address: activeAddress,
            event: WalletConnectEvent.Connected,
            dappName: session.peer.metadata.name,
            imageUrl: session.peer.metadata.icons[0] ?? null,
            hideDelay: 3 * ONE_SECOND_MS,
          })
        )
      } else {
        await wcWeb3Wallet.rejectSession({
          id: Number(pendingSession.id),
          reason: getSdkError('USER_REJECTED'),
        })
        dispatch(removePendingSession())
      }

      onClose()
      if (didOpenFromDeepLink) {
        returnToPreviousApp()
      }
    },
    [activeAddress, dispatch, onClose, selectedChainId, pendingSession, didOpenFromDeepLink]
  )
  const dappName = pendingSession.dapp.name || pendingSession.dapp.url

  return (
    <BottomSheetModal name={ModalName.WCPendingConnection} onClose={onClose}>
      <AnimatedFlex
        backgroundColor="background1"
        borderRadius="rounded12"
        flex={1}
        gap="spacing24"
        overflow="hidden"
        px="spacing24"
        py="spacing60">
        <Flex alignItems="center" flex={1} gap="spacing16" justifyContent="flex-end">
          <DappHeaderIcon dapp={pendingSession.dapp} showChain={false} />
          <Text fontWeight="bold" textAlign="center" variant="headlineSmall">
            {t('{{ dappName }} wants to connect to your wallet', {
              dappName: truncateDappName(dappName),
            })}{' '}
          </Text>
          <LinkButton
            backgroundColor="background2"
            borderRadius="rounded16"
            color={theme.colors.accentActive}
            iconColor={theme.colors.accentActive}
            label={pendingSession.dapp.url}
            mb="spacing12"
            px="spacing8"
            py="spacing4"
            size={theme.iconSizes.icon12}
            textVariant="buttonLabelMicro"
            url={pendingSession.dapp.url}
          />
        </Flex>
        <Flex bg="background2" borderRadius="rounded16" gap="spacing2">
          <SitePermissions />
          <Separator color="background1" width={1} />
          {pendingSession.version === '1' ? (
            <>
              <SwitchNetworkRow selectedChainId={selectedChainId} setModalState={setModalState} />
              <Separator color="background1" width={1} />
            </>
          ) : (
            <>
              <NetworksRow chains={pendingSession.chains} />
              <Separator color="background1" width={1} />
            </>
          )}
          <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
          <Box />
        </Flex>
        <Flex flexDirection="row" gap="spacing8" justifyContent="space-between">
          <Button
            fill
            emphasis={ButtonEmphasis.Secondary}
            label={t('Cancel')}
            onPress={(): Promise<void> => onPressSettleConnection(false)}
          />
          <Button
            fill
            label={t('Connect')}
            onPress={(): Promise<void> => onPressSettleConnection(true)}
          />
        </Flex>
      </AnimatedFlex>
      {modalState === PendingConnectionModalState.SwitchNetwork && (
        <PendingConnectionSwitchNetworkModal
          selectedChainId={selectedChainId}
          onClose={(): void => setModalState(PendingConnectionModalState.Hidden)}
          onPressChain={(chainId): void => {
            setSelectedChainId(chainId)
            setModalState(PendingConnectionModalState.Hidden)
          }}
        />
      )}
      {modalState === PendingConnectionModalState.SwitchAccount && (
        <PendingConnectionSwitchAccountModal
          activeAccount={activeAccount}
          onClose={(): void => setModalState(PendingConnectionModalState.Hidden)}
          onPressAccount={(account): void => {
            dispatch(setAccountAsActive(account.address))
            setModalState(PendingConnectionModalState.Hidden)
          }}
        />
      )}
    </BottomSheetModal>
  )
}
