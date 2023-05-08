import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import EyeIcon from 'src/assets/icons/eye.svg'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Box } from 'src/components/layout'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { WalletConnectRequestModal } from 'src/components/WalletConnect/RequestModal/WalletConnectRequestModal'
import { WalletConnectSwitchChainModal } from 'src/components/WalletConnect/RequestModal/WalletConnectSwitchChainModal'
import { PendingConnectionModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionModal'
import { WalletConnectModal } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  useActiveAccount,
  useActiveAccountAddressWithThrow,
  useSignerAccounts,
} from 'src/features/wallet/hooks'
import { EthMethod } from 'src/features/walletConnect/types'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import {
  removePendingSession,
  removeRequest,
  setDidOpenFromDeepLink,
  SwitchChainRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { areAddressesEqual } from 'src/utils/addresses'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

export function WalletConnectModals(): JSX.Element {
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()

  const { pendingRequests, modalState, pendingSession } = useWalletConnect(activeAccount?.address)

  /*
   * Reset didOpenFromDeepLink state when app is backgrounded, since we only want
   * to call `returnToPreviousApp` when the app was deep linked to from another app.
   * Handles case where user opens app via WalletConnect deep link, backgrounds app, then
   * opens Uniswap app via Spotlight search – we don't want `returnToPreviousApp` to return
   * to Spotlight search.
   * */
  useAppStateTrigger('active', 'inactive', () => {
    dispatch(setDidOpenFromDeepLink(undefined))
  })

  const currRequest = pendingRequests[0] ?? null

  const onCloseWCModal = (): void => {
    dispatch(closeModal({ name: ModalName.WalletConnectScan }))
  }

  // TODO: Move returnToPreviousApp() call to onClose but ensure it is not called twice
  const onClosePendingConnection = (): void => {
    dispatch(removePendingSession())
  }

  // When WalletConnectModal is open and a WC QR code is scanned to add a pendingSession,
  // dismiss the scan modal in favor of showing PendingConnectionModal
  useEffect(() => {
    if (modalState.isOpen && pendingSession) {
      dispatch(closeModal({ name: ModalName.WalletConnectScan }))
    }
  }, [modalState.isOpen, pendingSession, dispatch])

  return (
    <>
      {modalState.isOpen && (
        <WalletConnectModal initialScreenState={modalState.initialState} onClose={onCloseWCModal} />
      )}
      {pendingSession ? (
        <PendingConnectionModal
          pendingSession={pendingSession}
          onClose={onClosePendingConnection}
        />
      ) : null}
      {currRequest ? <RequestModal currRequest={currRequest} /> : null}
    </>
  )
}

type RequestModalProps = {
  currRequest: WalletConnectRequest
}

function RequestModal({ currRequest }: RequestModalProps): JSX.Element {
  const signerAccounts = useSignerAccounts()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  // TODO: Move returnToPreviousApp() call to onClose but ensure it is not called twice
  const onClose = (): void => {
    dispatch(
      removeRequest({ requestInternalId: currRequest.internalId, account: activeAccountAddress })
    )
  }

  if (isSwitchNetworkRequest(currRequest)) {
    return <WalletConnectSwitchChainModal request={currRequest} onClose={onClose} />
  }

  const isRequestFromSignerAccount = signerAccounts.some((account) =>
    areAddressesEqual(account.address, currRequest.account)
  )

  if (!isRequestFromSignerAccount) {
    return (
      <WarningModal
        caption={t(
          'In order to sign messages or transactions, you’ll need to import the wallet’s recovery phrase.'
        )}
        closeText={t('Dismiss')}
        icon={
          <EyeIcon
            color={theme.colors.textSecondary}
            height={theme.iconSizes.icon24}
            strokeWidth={1.5}
            width={theme.iconSizes.icon24}
          />
        }
        modalName={ModalName.WCViewOnlyWarning}
        severity={WarningSeverity.None}
        title={t('This wallet is in view only mode')}
        onCancel={onClose}
        onClose={onClose}>
        <Box
          alignSelf="stretch"
          backgroundColor="background2"
          borderRadius="rounded16"
          p="spacing16">
          <AccountDetails address={currRequest.account} iconSize={theme.iconSizes.icon24} />
        </Box>
      </WarningModal>
    )
  }

  return <WalletConnectRequestModal request={currRequest} onClose={onClose} />
}

function isSwitchNetworkRequest(request: WalletConnectRequest): request is SwitchChainRequest {
  return request.type === EthMethod.SwitchChain || request.type === EthMethod.AddChain
}
