import { OnboardingScreens } from 'src/screens/Screens'

export enum ImportType {
  CreateNew = 'CreateNew',
  CreateAdditional = 'CreateAdditional',
  NotYetSelected = 'NotYetSelected',
  SeedPhrase = 'SeedPhrase',
  Watch = 'Watch',
  Restore = 'Restore',
}

export enum OnboardingEntryPoint {
  Sidebar = 'Sidebar',
  FreshInstallOrReplace = 'FreshInstallOrReplace',
}

// Screens in order based on the import method being used. Currently only used for onboarding header indicator
const FLOWS: Record<ImportType, OnboardingScreens[]> = {
  [ImportType.CreateNew]: [
    OnboardingScreens.EditName,
    OnboardingScreens.Backup,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.CreateAdditional]: [
    OnboardingScreens.EditName,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.SeedPhrase]: [
    OnboardingScreens.SeedPhraseInput,
    OnboardingScreens.SelectWallet,
    OnboardingScreens.Backup,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.Watch]: [
    OnboardingScreens.WatchWallet,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  // @TODO [MOB-3894] Fill out restore flow.
  [ImportType.Restore]: [],
  // Will not show header for flow until a selection of import type is made
  [ImportType.NotYetSelected]: [],
}

export function getFlow(
  importType: ImportType,
  isBiometricAuthEnabled: boolean,
  hasSeedPhrase: boolean,
  isInitialOnboarding: boolean
): OnboardingScreens[] {
  let flows = FLOWS[importType]
  if ((isBiometricAuthEnabled || hasSeedPhrase) && !isInitialOnboarding) {
    flows = flows.filter((screen) => screen !== OnboardingScreens.Security)
  }
  return flows
}

// Reference the flow description to detect the index within total steps based on screen name.
export function getStepNumber(
  flow: OnboardingScreens[],
  screenName?: OnboardingScreens
): number | undefined {
  if (!screenName) return undefined
  const stepNumber = flow.indexOf(screenName)
  return stepNumber === -1 ? undefined : stepNumber
}
