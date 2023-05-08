import type { Middleware, PayloadAction, PreloadedState } from '@reduxjs/toolkit'
import { configureStore, isRejectedWithValue } from '@reduxjs/toolkit'
import { MMKV } from 'react-native-mmkv'
import { persistReducer, persistStore, Storage } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { ReducerNames, rootReducer, RootState } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { onChainBalanceApi } from 'src/features/balances/api'
import { ensApi } from 'src/features/ens/api'
import { fiatOnRampApi } from 'src/features/fiatOnRamp/api'
import { gasApi } from 'src/features/gas/api'
import { routingApi } from 'src/features/routing/routingApi'
import { trmApi } from 'src/features/trm/api'
import { isNonJestDev } from 'src/utils/environment'
import { logger } from 'src/utils/logger'

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

const sagaMiddleware = createSagaMiddleware({
  context: {
    signers: walletContextValue.signers,
    providers: walletContextValue.providers,
    contracts: walletContextValue.contracts,
  },
})

// list of apis to ignore when logging errors, i.e. logging is handled by api
const rtkQueryErrorLoggerIgnorelist: Array<ReducerNames> = [
  ensApi.reducerPath, // verbose
  routingApi.reducerPath, // verbose, handled in routing hook
]
const rtkQueryErrorLogger: Middleware = () => (next) => (action: PayloadAction<unknown>) => {
  if (!isRejectedWithValue(action)) {
    return next(action)
  }

  const shouldSkipErrorLogging = rtkQueryErrorLoggerIgnorelist.some((reducerName) =>
    action.type.startsWith(reducerName)
  )
  if (shouldSkipErrorLogging) {
    // still log in debug to ensure those errors are surfaced, but avoids polutting sentry
    logger.debug('store', 'rtkQueryErrorLogger', JSON.stringify(action))
  } else {
    logger.error(
      'store',
      'rtkQueryErrorLogger',
      // extract specific properties to avoid PII
      JSON.stringify({
        type: action.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        endpointName: (action.meta as any)?.arg?.endpointName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (action.payload as any)?.status,
        error: action.error,
      })
    )
  }

  return next(action)
}

const whitelist: Array<ReducerNames> = [
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
  ensApi.reducerPath,
  trmApi.reducerPath,
]

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist,
  version: 41,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, rootReducer)

const middlewares: Middleware[] = []
if (isNonJestDev()) {
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

// eslint-disable-next-line prettier/prettier, @typescript-eslint/explicit-function-return-type
export const setupStore = (
  preloadedState?: PreloadedState<RootState>
) => {
  return configureStore({
    reducer: persistedReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // required for rtk-query
        thunk: true,
        // turn off since it slows down for dev and also doesn't run in prod
        // TODO: [MOB-681] figure out why this is slow
        serializableCheck: false,
        invariantCheck: {
          warnAfter: 256,
        },
        // slows down dev build considerably
        immutableCheck: false,
      }).concat(
        ensApi.middleware,
        fiatOnRampApi.middleware,
        gasApi.middleware,
        onChainBalanceApi.middleware,
        routingApi.middleware,
        rtkQueryErrorLogger,
        sagaMiddleware,
        trmApi.middleware,
        ...middlewares
      ),
    devTools: config.debug,
  })
}
export const store = setupStore()

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
