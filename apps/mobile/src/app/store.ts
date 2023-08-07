import type { Middleware, PayloadAction, PreloadedState } from '@reduxjs/toolkit'
import { isRejectedWithValue } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react'
import { MMKV } from 'react-native-mmkv'
import { persistReducer, persistStore, Storage } from 'redux-persist'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { fiatOnRampApi } from 'src/features/fiatOnRamp/api'
import { logger } from 'wallet/src/features/logger/logger'
import { importAccountSagaName } from 'wallet/src/features/wallet/import/importAccountSaga'
import { createStore } from 'wallet/src/state'
import { RootReducerNames } from 'wallet/src/state/reducer'
import { isNonJestDev } from 'wallet/src/utils/environment'
import { mobileReducer, MobileState, ReducerNames } from './reducer'
import { mobileSaga } from './saga'

const storage = new MMKV()

export const reduxStorage: Storage = {
  setItem: (key, value) => {
    storage.set(key, value)
    return Promise.resolve(true)
  },
  getItem: (key) => {
    const value = storage.getString(key)
    return Promise.resolve(value)
  },
  removeItem: (key) => {
    storage.delete(key)
    return Promise.resolve()
  },
}

const rtkQueryErrorLogger: Middleware = () => (next) => (action: PayloadAction<unknown>) => {
  if (!isRejectedWithValue(action)) {
    return next(action)
  }

  logger.error(action.error, {
    tags: {
      file: 'store',
      function: 'rtkQueryErrorLogger',
      error: JSON.stringify({
        type: action.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        endpointName: (action.meta as any)?.arg?.endpointName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (action.payload as any)?.status,
        error: action.error,
      }),
    },
  })

  return next(action)
}

const whitelist: Array<ReducerNames | RootReducerNames> = [
  'appearanceSettings',
  'biometricSettings',
  'chains',
  'favorites',
  'notifications',
  'passwordLockout',
  'searchHistory',
  'telemetry',
  'tokens',
  'transactions',
  'wallet',
]

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist,
  version: 46,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, mobileReducer)

const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  // Add any restrictions here for when the enhancer should not be used
  actionTransformer: (action) => {
    if (action.type === `${importAccountSagaName}/trigger`) {
      // Return null in the case of importing an account, as the payload could contain the mnemonic
      return null
    }

    return action
  },
})

const middlewares: Middleware[] = []
if (isNonJestDev()) {
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

// eslint-disable-next-line prettier/prettier, @typescript-eslint/explicit-function-return-type
export const setupStore = (
  preloadedState?: PreloadedState<MobileState>
) => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [mobileSaga],
    middlewareAfter: [fiatOnRampApi.middleware, rtkQueryErrorLogger, ...middlewares],
    enhancers: [sentryReduxEnhancer],
  })
}
export const store = setupStore()

export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
