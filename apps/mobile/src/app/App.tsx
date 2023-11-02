import { ApolloProvider } from '@apollo/client'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance'
import { default as React, StrictMode, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { I18nManager, NativeModules, StatusBar } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { useAppSelector } from 'src/app/hooks'
import { AppModals } from 'src/app/modals/AppModals'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import Trace from 'src/components/Trace/Trace'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import { usePersistedApolloClient } from 'src/data/usePersistedApolloClient'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { shouldLogScreen } from 'src/features/telemetry/directLogScreens'
import { TransactionHistoryUpdater } from 'src/features/transactions/TransactionHistoryUpdater'
import {
  processWidgetEvents,
  setAccountAddressesUserDefaults,
  setFavoritesUserDefaults,
} from 'src/features/widgets/widgets'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { getSentryEnvironment, getStatsigEnvironmentTier } from 'src/utils/version'
import { StatsigProvider } from 'statsig-react-native'
import { flexStyles } from 'ui/src'
import { registerConsoleOverrides } from 'utilities/src/logger/console'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { config } from 'wallet/src/config'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useCurrentAppearanceSetting, useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { useTrmQuery } from 'wallet/src/features/trm/api'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { useAccounts, useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { initializeTranslation } from 'wallet/src/i18n/i18n'
import { SharedProvider } from 'wallet/src/provider'
import { CurrencyId } from 'wallet/src/utils/currencyId'

if (__DEV__) {
  registerConsoleOverrides()
}

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

// Dummy key since we use the reverse proxy will handle the real key
const DUMMY_STATSIG_SDK_KEY = 'client-0000000000000000000000000000000000000000000'

if (!__DEV__) {
  Sentry.init({
    environment: getSentryEnvironment(),
    dsn: config.sentryDsn,
    attachViewHierarchy: true,
    enableCaptureFailedRequests: true,
    tracesSampler: (_) => {
      return 0.2
    },
    integrations: [
      new Sentry.ReactNativeTracing({
        enableUserInteractionTracing: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation,
      }),
    ],
    // By default, the Sentry SDK normalizes any context to a depth of 3.
    // We're increasing this to be able to see the full depth of the Redux state.
    normalizeDepth: 10,
  })
}

initOneSignal()
initAppsFlyer()
initializeTranslation()

function App(): JSX.Element | null {
  // We want to ensure deviceID is used as the identifier to link with analytics
  const fetchAndSetDeviceId = useCallback(async () => {
    const uniqueId = await getUniqueId()
    Sentry.setUser({
      id: uniqueId,
    })
    return uniqueId
  }, [])

  const deviceId = useAsyncData(fetchAndSetDeviceId).data

  const statSigOptions = {
    options: {
      environment: {
        tier: getStatsigEnvironmentTier(),
      },
      api: uniswapUrls.statsigProxyUrl,
    },
    sdkKey: DUMMY_STATSIG_SDK_KEY,
    user: deviceId ? { userID: deviceId } : {},
    waitForInitialization: true,
  }

  I18nManager.forceRTL(false)

  return (
    <Trace>
      <StrictMode>
        <StatsigProvider {...statSigOptions}>
          <SafeAreaProvider>
            <SharedProvider reduxStore={store}>
              <AnalyticsNavigationContextProvider
                shouldLogScreen={shouldLogScreen}
                useIsPartOfNavigationTree={useIsPartOfNavigationTree}>
                <AppOuter />
              </AnalyticsNavigationContextProvider>
            </SharedProvider>
          </SafeAreaProvider>
        </StatsigProvider>
      </StrictMode>
    </Trace>
  )
}

// Ensures redux state is available inside usePersistedApolloClient for the custom endpoint
function AppOuter(): JSX.Element | null {
  const client = usePersistedApolloClient()

  const onReportPrepared = useCallback((report: RenderPassReport) => {
    sendMobileAnalyticsEvent(MobileEventName.PerformanceReport, report)
  }, [])

  if (!client) {
    return null
  }

  return (
    <ApolloProvider client={client}>
      <PersistGate loading={null} persistor={persistor}>
        <ErrorBoundary>
          <GestureHandlerRootView style={flexStyles.fill}>
            <WalletContextProvider>
              <BiometricContextProvider>
                <LockScreenContextProvider>
                  <Sentry.TouchEventBoundary>
                    <DataUpdaters />
                    <BottomSheetModalProvider>
                      <AppModals />
                      <PerformanceProfiler onReportPrepared={onReportPrepared}>
                        <AppInner />
                      </PerformanceProfiler>
                    </BottomSheetModalProvider>
                  </Sentry.TouchEventBoundary>
                </LockScreenContextProvider>
              </BiometricContextProvider>
            </WalletContextProvider>
          </GestureHandlerRootView>
        </ErrorBoundary>
      </PersistGate>
    </ApolloProvider>
  )
}

function AppInner(): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const themeSetting = useCurrentAppearanceSetting()

  useEffect(() => {
    // TODO: This is a temporary solution (it should be replaced with Appearance.setColorScheme
    // after updating RN to 0.72.0 or higher)
    NativeModules.ThemeModule.setColorScheme(themeSetting)
  }, [themeSetting])

  return <NavStack isDarkMode={isDarkMode} />
}

function DataUpdaters(): JSX.Element {
  const activeAccount = useActiveAccount()
  const favoriteTokens: CurrencyId[] = useAppSelector(selectFavoriteTokens)
  const accountsMap: Record<string, Account> = useAccounts()
  const currentLanguageInfo = useCurrentLanguageInfo()
  const { i18n } = useTranslation()

  useTrmQuery(
    activeAccount && activeAccount.type === AccountType.SignerMnemonic
      ? activeAccount.address
      : undefined
  )

  // Refreshes widgets when bringing app to foreground
  useAppStateTrigger('background', 'active', processWidgetEvents)

  useEffect(() => {
    setFavoritesUserDefaults(favoriteTokens)
  }, [favoriteTokens])

  useEffect(() => {
    setAccountAddressesUserDefaults(Object.values(accountsMap))
  }, [accountsMap])

  useEffect(() => {
    const locale = currentLanguageInfo.locale
    if (locale !== i18n.language) {
      i18n
        .changeLanguage(locale)
        .catch(() =>
          logger.warn(
            'App',
            'DataUpdaters',
            'Sync of language setting state and i18n instance failed'
          )
        )
    }
  }, [i18n, currentLanguageInfo])

  return (
    <>
      <TraceUserProperties />
      <TransactionHistoryUpdater />
    </>
  )
}

function NavStack({ isDarkMode }: { isDarkMode: boolean }): JSX.Element {
  return (
    <NavigationContainer
      onReady={(navigationRef): void => {
        routingInstrumentation.registerNavigationContainer(navigationRef)
      }}>
      <OfflineBanner />
      <AppStackNavigator />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <NotificationToastWrapper />
    </NavigationContainer>
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getApp() {
  return __DEV__ ? App : Sentry.wrap(App)
}

export default getApp()
