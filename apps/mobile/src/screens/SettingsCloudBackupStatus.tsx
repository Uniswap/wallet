import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import Checkmark from 'src/assets/icons/check.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { deleteICloudMnemonicBackup } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType, BackupType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsCloudBackupStatus>

export function SettingsCloudBackupStatus({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const accounts = useAccounts()

  const mnemonicId = (accounts[address] as SignerMnemonicAccount)?.mnemonicId
  const associatedAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === mnemonicId
  )

  const [showBackupDeleteWarning, setShowBackupDeleteWarning] = useState(false)
  const onConfirmDeleteBackup = (): void => {
    if (requiredForTransactions) {
      biometricTrigger()
    } else {
      deleteBackup()
    }
  }

  const deleteBackup = async (): Promise<void> => {
    try {
      await deleteICloudMnemonicBackup(mnemonicId)
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.RemoveBackupMethod,
          address,
          backupMethod: BackupType.Cloud,
        })
      )
      setShowBackupDeleteWarning(false)
      navigation.navigate(Screens.SettingsWallet, { address })
    } catch (error) {
      setShowBackupDeleteWarning(false)
      const err = error as Error
      logger.error('SettingsCloudBackStatus', 'deleteBackup', `${error}`)
      Alert.alert(t('iCloud error'), err.message, [
        {
          text: t('OK'),
          style: 'default',
        },
      ])
    }
  }

  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(deleteBackup)

  return (
    <Screen mx="spacing16" my="spacing16">
      <BackHeader alignment="center" mb="spacing16">
        <Text variant="bodyLarge">{t('iCloud backup')}</Text>
      </BackHeader>

      <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="spacing16">
        <Flex grow gap="spacing24" justifyContent="flex-start">
          <Text color="textSecondary" variant="bodySmall">
            {t(
              'By having your recovery phrase backed up to iCloud, you can recover your wallet just by being logged into your iCloud on any device.'
            )}
          </Text>
          <Flex row justifyContent="space-between">
            <Text variant="bodyLarge">{t('Recovery phrase')}</Text>
            <Flex row alignItems="center" gap="spacing12" justifyContent="space-around">
              <Text color="textSecondary" variant="buttonLabelMicro">
                {t('Backed up')}
              </Text>

              {/* @TODO: [MOB-3919] Add non-backed up state once we have more options on this page  */}
              <Checkmark color={theme.colors.accentSuccess} height={24} width={24} />
            </Flex>
          </Flex>
        </Flex>
        <Button
          emphasis={ButtonEmphasis.Detrimental}
          label={t('Delete iCloud backup')}
          name={ElementName.Remove}
          onPress={(): void => {
            setShowBackupDeleteWarning(true)
          }}
        />
      </Flex>

      {showBackupDeleteWarning && (
        <WarningModal
          caption={t(
            'If you delete your iCloud backup, you’ll only be able to recover your wallet with a manual backup of your recovery phrase. Uniswap Labs can’t recover your assets if you lose your recovery phrase.'
          )}
          closeText={t('Cancel')}
          confirmText={t('Delete')}
          modalName={ModalName.ViewSeedPhraseWarning}
          title={t('Are you sure?')}
          onClose={(): void => {
            setShowBackupDeleteWarning(false)
          }}
          onConfirm={onConfirmDeleteBackup}>
          {associatedAccounts.length > 1 && (
            <Flex>
              <Text textAlign="left" variant="subheadSmall">
                {t(
                  'Because these wallets share a recovery phrase, it will also delete the backups for:'
                )}
              </Text>
              <Flex>
                {associatedAccounts.map((account) => (
                  <AddressDisplay address={account.address} size={36} variant="subheadLarge" />
                ))}
              </Flex>
            </Flex>
          )}
        </WarningModal>
      )}
    </Screen>
  )
}
