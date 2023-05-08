import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import {
  startFetchingICloudBackups,
  stopFetchingICloudBackups,
} from 'src/features/CloudBackup/RNICloudBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { OnboardingScreens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'
import { ONE_SECOND_MS } from 'src/utils/time'
import { useTimeout } from 'src/utils/timing'
import { useAddBackButton } from 'src/utils/useAddBackButton'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupLoading
>

const MIN_LOADING_UI_MS = ONE_SECOND_MS
// 10s timeout time for query for backups, since we don't know when the query completes
const MAX_LOADING_TIMEOUT_MS = ONE_SECOND_MS * 10

export function RestoreCloudBackupLoadingScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const entryPoint = params?.entryPoint

  const [isLoading, setIsLoading] = useState(true)
  const backups = useCloudBackups()

  useAddBackButton(navigation)

  // Starts query for iCloud backup files, backup files found are streamed into Redux
  useEffect(() => {
    const timer = fetchICloudBackupsWithTimeout()

    return () => {
      stopFetchingICloudBackups()
      clearTimeout(timer)
    }
  }, [])

  const fetchICloudBackupsWithTimeout = (): NodeJS.Timeout => {
    // Show loading state for max 10s, then show no backups found
    setIsLoading(true)
    startFetchingICloudBackups()

    return setTimeout(() => {
      logger.debug(
        'RestoreCloudBackupLoadingScreen',
        'fetchICloudBackupsWithTimeout',
        `Timed out fetching iCloud backups after ${MAX_LOADING_TIMEOUT_MS}ms`
      )
      setIsLoading(false)
      stopFetchingICloudBackups()
    }, MAX_LOADING_TIMEOUT_MS)
  }

  // After finding backups, show loading state for minimum 1s to prevent screen changing too quickly
  useTimeout(
    backups.length > 0
      ? (): void => {
          if (backups.length === 1 && backups[0]) {
            navigation.replace(OnboardingScreens.RestoreCloudBackupPassword, {
              importType: ImportType.Restore,
              entryPoint,
              mnemonicId: backups[0].mnemonicId,
            })
          } else {
            navigation.replace(OnboardingScreens.RestoreCloudBackup, {
              importType: ImportType.Restore,
              entryPoint,
            })
          }
        }
      : (): undefined => undefined,
    MIN_LOADING_UI_MS
  )

  // Handle no backups found error state
  if (!isLoading && backups.length === 0) {
    return (
      <Box alignSelf="center" px="spacing16">
        <BaseCard.ErrorState
          description={t(`It looks like you haven't backed up any of your seed phrases to iCloud.`)}
          icon={
            <CloudIcon
              color={theme.colors.textTertiary}
              height={theme.imageSizes.image48}
              width={theme.imageSizes.image48}
            />
          }
          retryButtonLabel={t('Retry')}
          title={t('0 backups found')}
          onRetry={fetchICloudBackupsWithTimeout}
        />
      </Box>
    )
  }

  return (
    <OnboardingScreen title={t('Searching for backups...')}>
      <Loader.Wallets repeat={5} />
    </OnboardingScreen>
  )
}
