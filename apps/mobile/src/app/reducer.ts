import { combineReducers } from '@reduxjs/toolkit'
import { appearanceSettingsReducer } from 'src/features/appearance/slice'
import { biometricSettingsReducer } from 'src/features/biometrics/slice'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
import { searchHistoryReducer } from 'src/features/explore/searchHistorySlice'
import { favoritesReducer } from 'src/features/favorites/slice'
import { fiatOnRampApi } from 'src/features/fiatOnRamp/api'
import { modalsReducer } from 'src/features/modals/modalSlice'
import { telemetryReducer } from 'src/features/telemetry/slice'
import { tokensReducer } from 'src/features/tokens/tokensSlice'
import { transactionReducer } from 'src/features/transactions/slice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'
import { sharedReducers } from 'wallet/src/state/reducer'
import { monitoredSagaReducers } from './saga'

const reducers = {
  ...sharedReducers,
  [fiatOnRampApi.reducerPath]: fiatOnRampApi.reducer,
  appearanceSettings: appearanceSettingsReducer,
  biometricSettings: biometricSettingsReducer,
  cloudBackup: cloudBackupReducer,
  favorites: favoritesReducer,
  modals: modalsReducer,
  passwordLockout: passwordLockoutReducer,
  saga: monitoredSagaReducers,
  searchHistory: searchHistoryReducer,
  telemetry: telemetryReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  walletConnect: walletConnectReducer,
} as const
export const mobileReducer = combineReducers(reducers)

export type MobileState = ReturnType<typeof mobileReducer>
export type ReducerNames = keyof typeof reducers
