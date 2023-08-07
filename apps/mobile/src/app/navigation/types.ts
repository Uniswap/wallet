import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { EducationContentType } from 'src/components/education'
import { NFTItem } from 'src/features/nfts/types'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { TabIndex } from 'src/screens/HomeScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

type NFTItemScreenParams = {
  owner?: Address
  address: string
  tokenId: string
  isSpam?: boolean
  fallbackData?: NFTItem
}

export type CloudBackupFormParms = {
  address: Address
  password: string
}

export type ExploreStackParamList = {
  [Screens.Explore]: undefined
  [Screens.ExternalProfile]: {
    address: string
  }
  [Screens.NFTItem]: NFTItemScreenParams
  [Screens.NFTCollection]: { collectionAddress: string }
  [Screens.TokenDetails]: {
    currencyId: string
  }
}

export type AccountStackParamList = {
  [Screens.Accounts]: undefined
}

export type SettingsStackParamList = {
  [Screens.Settings]: undefined
  [Screens.SettingsWallet]: { address: Address }
  [Screens.SettingsWalletEdit]: { address: Address }
  [Screens.SettingsWalletManageConnection]: { address: Address }
  [Screens.SettingsHelpCenter]: undefined
  [Screens.SettingsChains]: undefined
  [Screens.SettingsBiometricAuth]: undefined
  [Screens.SettingsAppearance]: undefined
  [Screens.WebView]: { headerTitle: string; uriLink: string }
  [Screens.Dev]: undefined
  [Screens.SettingsCloudBackupPasswordCreate]: { address: Address }
  [Screens.SettingsCloudBackupPasswordConfirm]: CloudBackupFormParms
  [Screens.SettingsCloudBackupProcessing]: CloudBackupFormParms
  [Screens.SettingsCloudBackupStatus]: { address: Address }
  [Screens.SettingsViewSeedPhrase]: { address: Address }
}

export type OnboardingStackBaseParams = {
  importType: ImportType
  entryPoint: OnboardingEntryPoint
}

export type OnboardingStackParamList = {
  [OnboardingScreens.BackupManual]: OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudPasswordCreate]: {
    address: Address
  } & OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudPasswordConfirm]: CloudBackupFormParms & OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudProcessing]: CloudBackupFormParms & OnboardingStackBaseParams
  [OnboardingScreens.Backup]: OnboardingStackBaseParams
  [OnboardingScreens.Landing]: OnboardingStackBaseParams
  [OnboardingScreens.EditName]: OnboardingStackBaseParams
  [OnboardingScreens.SelectColor]: OnboardingStackBaseParams
  [OnboardingScreens.Notifications]: OnboardingStackBaseParams
  [OnboardingScreens.QRAnimation]: OnboardingStackBaseParams
  [OnboardingScreens.Security]: OnboardingStackBaseParams

  // import
  [OnboardingScreens.ImportMethod]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupLoading]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackup]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupPassword]: {
    mnemonicId: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.SeedPhraseInput]: OnboardingStackBaseParams
  [OnboardingScreens.SelectWallet]: OnboardingStackBaseParams
  [OnboardingScreens.WatchWallet]: OnboardingStackBaseParams
}

export type AppStackParamList = {
  [Screens.AccountStack]: NavigatorScreenParams<AccountStackParamList>
  [Screens.Education]: {
    type: EducationContentType
  } & OnboardingStackBaseParams
  [Screens.Home]?: { tab?: TabIndex }
  [Screens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [Screens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [Screens.TokenDetails]: {
    currencyId: string
  }
  [Screens.NFTItem]: NFTItemScreenParams
  [Screens.NFTCollection]: { collectionAddress: string }
  [Screens.ExternalProfile]: {
    address: string
  }
  [Screens.WebView]: { headerTitle: string; uriLink: string }
}

export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>
export type AppStackScreenProps = NativeStackScreenProps<AppStackParamList>
export type AppStackScreenProp<Screen extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  Screen
>

export type ExploreStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackScreenProp<Screen extends keyof SettingsStackParamList> =
  CompositeScreenProps<NativeStackScreenProps<SettingsStackParamList, Screen>, AppStackScreenProps>

export type OnboardingStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<OnboardingStackParamList>,
  AppStackNavigationProp
>

export type RootParamList = AccountStackParamList &
  AppStackParamList &
  ExploreStackParamList &
  OnboardingStackParamList &
  SettingsStackParamList

export const useAppStackNavigation = (): AppStackNavigationProp =>
  useNavigation<AppStackNavigationProp>()
export const useExploreStackNavigation = (): ExploreStackNavigationProp =>
  useNavigation<ExploreStackNavigationProp>()
export const useSettingsStackNavigation = (): SettingsStackNavigationProp =>
  useNavigation<SettingsStackNavigationProp>()
export const useOnboardingStackNavigation = (): OnboardingStackNavigationProp =>
  useNavigation<OnboardingStackNavigationProp>()
