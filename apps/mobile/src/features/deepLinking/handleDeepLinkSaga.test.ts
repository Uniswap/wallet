import { expectSaga } from 'redux-saga-test-plan'
import {
  handleDeepLink,
  handleUniswapAppDeepLink,
  handleWalletConnectDeepLink,
  parseAndValidateUserAddress,
} from 'src/features/deepLinking/handleDeepLinkSaga'

import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { openModal } from 'src/features/modals/modalSlice'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { account } from 'src/test/fixtures'
import { UNISWAP_APP_HOSTNAME } from 'wallet/src/constants/urls'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'wallet/src/test/fixtures'

const swapUrl = `https://uniswap.org/app?screen=swap&userAddress=${account.address}`
const transactionUrl = `https://uniswap.org/app?screen=transaction&userAddress=${account.address}`
const swapDeepLinkPayload = { url: swapUrl, coldStart: false }
const transactionDeepLinkPayload = { url: transactionUrl, coldStart: false }
const unsupportedScreenDeepLinkPayload = {
  url: `https://uniswap.org/app?screen=send&userAddress=${account.address}`,
  coldStart: false,
}

const wcUniversalLinkUrl = `https://uniswap.org/app/wc?uri=wc:123`
const wcUrlSchemeUrl = `uniswap://wc?uri=wc:123`
const invalidUrlSchemeUrl = `uniswap://invalid?param=pepe`

describe(handleDeepLink, () => {
  it('Routes to the swap deep link handler if screen=swap and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(parseAndValidateUserAddress, account.address)
      .put(setAccountAsActive(account.address))
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        url: swapDeepLinkPayload.url,
        screen: 'swap',
        is_cold_start: swapDeepLinkPayload.coldStart,
      })
      .silentRun()
  })

  it('Routes to the transaction deep link handler if screen=transaction and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: transactionDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleTransactionLink)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        url: transactionDeepLinkPayload.url,
        screen: 'transaction',
        is_cold_start: transactionDeepLinkPayload.coldStart,
      })
      .silentRun()
  })

  it('Fails if the screen param is not supported', () => {
    return expectSaga(handleDeepLink, { payload: unsupportedScreenDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .silentRun()
  })

  it('Fails if the userAddress does not exist in the wallet', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {},
          activeAccountAddress: null,
        },
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect Universal Link connection', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcUniversalLinkUrl, coldStart: false },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleWalletConnectDeepLink, 'wc:123')
      .returns(undefined)

      .silentRun()
  })

  it('Handles WalletConnect URL scheme connection', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcUrlSchemeUrl, coldStart: false },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleWalletConnectDeepLink, 'wc:123')
      .returns(undefined)
      .silentRun()
  })

  it('Fails arbitrary URL scheme deep link', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: invalidUrlSchemeUrl, coldStart: false },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })

      .returns(undefined)
      .silentRun()
  })

  it('Handles Share NFT Item Universal Link', () => {
    const hash = `#/nfts/asset/${SAMPLE_SEED_ADDRESS_1}/123`
    return expectSaga(handleDeepLink, {
      payload: {
        url: `https://${UNISWAP_APP_HOSTNAME}/${hash}`,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash)
      .put(
        openModal({
          name: ModalName.Explore,
          initialState: {
            screen: Screens.NFTItem,
            params: {
              address: SAMPLE_SEED_ADDRESS_1,
              tokenId: '123',
              isSpam: false,
            },
          },
        })
      )
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share NFT Collection Universal Link', () => {
    const hash = `#/nfts/collection/${SAMPLE_SEED_ADDRESS_1}`
    return expectSaga(handleDeepLink, {
      payload: {
        url: `https://${UNISWAP_APP_HOSTNAME}/${hash}`,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash)
      .put(
        openModal({
          name: ModalName.Explore,
          initialState: {
            screen: Screens.NFTCollection,
            params: {
              collectionAddress: SAMPLE_SEED_ADDRESS_1,
            },
          },
        })
      )
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share Token Item Universal Link', () => {
    const hash = `#/tokens/ethereum/${SAMPLE_SEED_ADDRESS_1}`
    return expectSaga(handleDeepLink, {
      payload: {
        url: `https://${UNISWAP_APP_HOSTNAME}/${hash}`,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash)
      .put(
        openModal({
          name: ModalName.Explore,
          initialState: {
            screen: Screens.TokenDetails,
            params: {
              currencyId: `1-${SAMPLE_SEED_ADDRESS_1}`,
            },
          },
        })
      )
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share currently active Account Address Universal Link', () => {
    const hash = `#/address/${account.address}`
    return expectSaga(handleDeepLink, {
      payload: {
        url: `https://${UNISWAP_APP_HOSTNAME}/${hash}`,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash)
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share already added Account Address Universal Link', () => {
    const hash = `#/address/${SAMPLE_SEED_ADDRESS_2}`
    return expectSaga(handleDeepLink, {
      payload: {
        url: `https://${UNISWAP_APP_HOSTNAME}/${hash}`,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
            [SAMPLE_SEED_ADDRESS_2]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash)
      .put(setAccountAsActive(SAMPLE_SEED_ADDRESS_2))
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share external Account Address Universal Link', () => {
    const hash = `#/address/${SAMPLE_SEED_ADDRESS_2}`
    return expectSaga(handleDeepLink, {
      payload: {
        url: `https://${UNISWAP_APP_HOSTNAME}/${hash}`,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash)
      .put(
        openModal({
          name: ModalName.Explore,
          initialState: {
            screen: Screens.ExternalProfile,
            params: {
              address: SAMPLE_SEED_ADDRESS_2,
            },
          },
        })
      )
      .returns(undefined)
      .silentRun()
  })
})
