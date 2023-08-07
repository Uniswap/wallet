import appsFlyer from 'react-native-appsflyer'
import { useAppDispatch } from 'src/app/hooks'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { useTrace } from 'wallet/src/features/telemetry/trace/TraceContext'
import { Account, BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  pendingAccountActions,
  PendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

/**
 * Bundles various actions that should be performed to complete onboarding.
 *
 * Used within the final screen of various onboarding flows.
 */
export function useCompleteOnboardingCallback(
  entryPoint: OnboardingEntryPoint,
  importType: ImportType
): () => Promise<void> {
  const dispatch = useAppDispatch()
  const pendingAccounts = usePendingAccounts()
  const pendingWalletAddresses = Object.keys(pendingAccounts)
  const parentTrace = useTrace()
  const navigation = useOnboardingStackNavigation()

  return async () => {
    sendAnalyticsEvent(
      entryPoint === OnboardingEntryPoint.Sidebar
        ? MobileEventName.WalletAdded
        : MobileEventName.OnboardingCompleted,
      {
        wallet_type: importType,
        accounts_imported_count: pendingWalletAddresses.length,
        wallets_imported: pendingWalletAddresses,
        cloud_backup_used: Object.values(pendingAccounts).some((acc: Account) =>
          acc.backups?.includes(BackupType.Cloud)
        ),
        ...parentTrace,
      }
    )
    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Activate))

    // Exit flow
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
    if (entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate(Screens.Home)
    }

    if (entryPoint === OnboardingEntryPoint.FreshInstallOrReplace) {
      await appsFlyer.logEvent('onboarding_complete', { importType })
    }
  }
}
