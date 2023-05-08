import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/rootSaga'
import { appearanceSettingsReducer } from 'src/features/appearance/slice'
import { onChainBalanceApi } from 'src/features/balances/api'
import { biometricSettingsReducer } from 'src/features/biometrics/slice'
import { chainsReducer } from 'src/features/chains/chainsSlice'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
import { ensApi } from 'src/features/ens/api'
import { searchHistoryReducer } from 'src/features/explore/searchHistorySlice'
import { favoritesReducer } from 'src/features/favorites/slice'
import { fiatOnRampApi } from 'src/features/fiatOnRamp/api'
import { gasApi } from 'src/features/gas/api'
import { modalsReducer } from 'src/features/modals/modalSlice'
import { notificationReducer } from 'src/features/notifications/notificationSlice'
import { providersReducer } from 'src/features/providers/providerSlice'
import { routingApi } from 'src/features/routing/routingApi'
import { telemetryReducer } from 'src/features/telemetry/slice'
import { tokensReducer } from 'src/features/tokens/tokensSlice'
import { transactionReducer } from 'src/features/transactions/slice'
import { trmApi } from 'src/features/trm/api'
import { walletReducer } from 'src/features/wallet/walletSlice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'

const reducers = {
  [ensApi.reducerPath]: ensApi.reducer,
  [fiatOnRampApi.reducerPath]: fiatOnRampApi.reducer,
  [gasApi.reducerPath]: gasApi.reducer,
  [onChainBalanceApi.reducerPath]: onChainBalanceApi.reducer,
  [routingApi.reducerPath]: routingApi.reducer,
  [trmApi.reducerPath]: trmApi.reducer,
  appearanceSettings: appearanceSettingsReducer,
  biometricSettings: biometricSettingsReducer,
  chains: chainsReducer,
  cloudBackup: cloudBackupReducer,
  favorites: favoritesReducer,
  modals: modalsReducer,
  notifications: notificationReducer,
  passwordLockout: passwordLockoutReducer,
  providers: providersReducer,
  saga: monitoredSagaReducers,
  searchHistory: searchHistoryReducer,
  telemetry: telemetryReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
  walletConnect: walletConnectReducer,
} as const
export const rootReducer = combineReducers(reducers)

export type RootState = ReturnType<typeof rootReducer>
export type ReducerNames = keyof typeof reducers
