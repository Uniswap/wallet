import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePrevious } from 'react-native-wagmi-charts'
import { HiddenMnemonicWordView } from 'src/components/mnemonic/HiddenMnemonicWordView'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { Button, Flex } from 'ui/src'

type Props = {
  mnemonicId: string
  onDismiss?: () => void
  walletNeedsRestore?: boolean
}

export function SeedPhraseDisplay({
  mnemonicId,
  onDismiss,
  walletNeedsRestore,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { isModalOpen: isWalletRestoreModalOpen } = useWalletRestore({ openModalImmediately: true })
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [showSeedPhraseViewWarningModal, setShowSeedPhraseViewWarningModal] = useState(
    !walletNeedsRestore
  )

  const prevIsWalletRestoreModalOpen = usePrevious(isWalletRestoreModalOpen)

  useEffect(() => {
    if (prevIsWalletRestoreModalOpen && !isWalletRestoreModalOpen) {
      onDismiss?.()
    }
  })

  const onShowSeedPhraseConfirmed = (): void => {
    setShowSeedPhrase(true)
    setShowSeedPhraseViewWarningModal(false)
  }

  const onConfirmWarning = async (): Promise<void> => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      await biometricTrigger()
    } else {
      onShowSeedPhraseConfirmed()
    }
  }

  const {
    requiredForAppAccess: biometricAuthRequiredForAppAccess,
    requiredForTransactions: biometricAuthRequiredForTransactions,
  } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(onShowSeedPhraseConfirmed)

  useEffect(() => {
    const listener = addScreenshotListener(() => setShowScreenShotWarningModal(showSeedPhrase))
    return () => listener?.remove()
  }, [showSeedPhrase])

  return (
    <>
      {showSeedPhrase ? (
        <Flex grow mt="$spacing16">
          <Flex grow pt="$spacing16" px="$spacing16">
            <MnemonicDisplay mnemonicId={mnemonicId} />
          </Flex>
          <Flex borderTopColor="$surface3" borderTopWidth={1} pt="$spacing12" px="$spacing16">
            <Button
              testID={ElementName.Next}
              theme="secondary"
              onPress={(): void => {
                setShowSeedPhrase(false)
              }}>
              {t('Hide recovery phrase')}
            </Button>
          </Flex>
        </Flex>
      ) : (
        <HiddenMnemonicWordView />
      )}

      {showSeedPhraseViewWarningModal && (
        <WarningModal
          hideHandlebar
          caption={t(
            'Please only view your recovery phrase in a private place. Anyone who knows your recovery phrase can access your wallet and funds.'
          )}
          closeText={t('Go back')}
          confirmText={t('View phrase')}
          isDismissible={false}
          modalName={ModalName.ViewSeedPhraseWarning}
          title={t('Be careful')}
          onCancel={(): void => {
            setShowSeedPhraseViewWarningModal(false)
            if (!showSeedPhrase) {
              onDismiss?.()
            }
          }}
          onConfirm={onConfirmWarning}
        />
      )}
      {showScreenShotWarningModal && (
        <WarningModal
          caption={t(
            'Anyone who gains access to your photos can access your wallet. We recommend that you write down your words instead.'
          )}
          confirmText={t('OK')}
          modalName={ModalName.ScreenshotWarning}
          title={t('Screenshots aren’t secure')}
          onConfirm={(): void => setShowScreenShotWarningModal(false)}
        />
      )}
    </>
  )
}
