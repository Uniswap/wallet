import { ThunkDispatch } from '@reduxjs/toolkit'
import { useTheme } from '@shopify/restyle'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from 'src/app/store'
import { SagaGenerator, select } from 'typed-redux-saga'
import type { Theme } from 'ui/src/theme/restyle/theme'
import type { MobileState } from './reducer'

// Use throughout the app instead of plain `useDispatch` and `useSelector`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAppDispatch = (): ThunkDispatch<any, any, any> => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<MobileState> = useSelector

// Pre-typed Restyle theme accessor hook
export const useAppTheme = (): Theme => useTheme<Theme>()

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: MobileState) => T): SagaGenerator<T> {
  const state = yield* select(fn)
  return state
}
