import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { CloudBackupPasswordForm } from 'src/features/CloudBackup/CloudBackupPasswordForm'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  Screens.SettingsCloudBackupPasswordConfirm
>

export function SettingsCloudBackupPasswordConfirmScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { password } = params

  const navigateToNextScreen = (): void => {
    navigation.navigate({
      name: Screens.SettingsCloudBackupProcessing,
      params,
      merge: true,
    })
  }

  return (
    <Screen mx="spacing16" my="spacing16">
      <BackHeader mb="spacing16" />
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
        <Flex alignItems="center" justifyContent="space-between" mb="spacing24" mx="spacing12">
          <Text textAlign="center" variant="headlineSmall">
            {t('Confirm your backup password')}
          </Text>
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {t(
              "You’ll need to enter this password to recover your account. It's not stored anywhere, so it can't be recovered by anyone else."
            )}
          </Text>
        </Flex>
        <CloudBackupPasswordForm
          isConfirmation={true}
          navigateToNextScreen={navigateToNextScreen}
          passwordToConfirm={password}
        />
      </ScrollView>
    </Screen>
  )
}
