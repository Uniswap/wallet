import { createAction } from '@reduxjs/toolkit'
import { URL } from 'react-native-url-polyfill'
import { CallEffect, ForkEffect, PutEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName } from 'src/features/telemetry/constants'
import { selectAccounts } from 'src/features/wallet/selectors'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { connectToApp, isValidWCUrl } from 'src/features/walletConnect/WalletConnect'
import { logger } from 'src/utils/logger'
import { call, fork, put, takeLatest } from 'typed-redux-saga'

export interface DeepLink {
  url: string
  coldStart: boolean
}

export const openDeepLink = createAction<DeepLink>('deeplink/open')

export function* deepLinkWatcher(): Generator<ForkEffect<never>, void, unknown> {
  yield* takeLatest(openDeepLink.type, handleDeepLink)
}

export function* handleDeepLink(action: ReturnType<typeof openDeepLink>): Generator<
  | CallEffect<boolean>
  | CallEffect<string>
  | ForkEffect<void>
  | PutEffect<{
      payload: string
      type: string
    }>
  | CallEffect<unknown>,
  void,
  unknown
> {
  const { coldStart } = action.payload
  try {
    const url = new URL(action.payload.url)

    // handle WC deeplink connections
    const wcUri = url.searchParams.get('uri')
    if (url.pathname.includes('/wc') && wcUri) {
      const isValidWcUri = yield* call(isValidWCUrl, wcUri)
      if (isValidWcUri) {
        yield* fork(connectToApp, wcUri)
      }
      return
    }

    const screen = url.searchParams.get('screen')
    const userAddress = url.searchParams.get('userAddress')

    const validUserAddress = yield* call(parseAndValidateUserAddress, userAddress)
    yield* put(activateAccount(validUserAddress))

    switch (screen) {
      case 'transaction':
        yield* call(handleTransactionLink)
        break
      case 'swap':
        yield* call(handleSwapLink, url)
        break
      default:
        throw new Error('Invalid or unsupported screen')
    }

    yield* call(sendAnalyticsEvent, EventName.DeepLinkOpened, {
      url: url.toString(),
      screen,
      is_cold_start: coldStart,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const errorMessage = error?.message
    yield* call(
      logger.error,
      'handleDeepLink',
      'handleDeepLink',
      `Error handling deep link ${action.payload.url}: ${errorMessage}`
    )
  }
}

export function* parseAndValidateUserAddress(
  userAddress: string | null
): Generator<SelectEffect, string, unknown> {
  if (!userAddress) {
    throw new Error('No `userAddress` provided')
  }

  const userAccounts = yield* appSelect(selectAccounts)
  const matchingAccount = Object.values(userAccounts).find(
    (account) => account.address.toLowerCase() === userAddress.toLowerCase()
  )

  if (!matchingAccount) {
    throw new Error('User address supplied in path does not exist in wallet')
  }

  return matchingAccount.address
}
