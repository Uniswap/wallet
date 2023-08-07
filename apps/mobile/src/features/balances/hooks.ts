import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectTokensVisibility } from 'src/features/favorites/selectors'
import { toggleTokenVisibility, TokenVisibility } from 'src/features/favorites/slice'
import { useSelectLocalTxCurrencyIds } from 'src/features/transactions/hooks'
import { getTokenUrl } from 'src/utils/linking'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { logger } from 'wallet/src/features/logger/logger'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'

import {
  useActiveAccountAddressWithThrow,
  useSelectAccountHideSmallBalances,
  useSelectAccountHideSpamTokens,
} from 'wallet/src/features/wallet/hooks'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import serializeError from 'wallet/src/utils/serializeError'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'

interface TokenMenuParams {
  currencyId: CurrencyId
  isSpam: Maybe<boolean>
  isNative: Maybe<boolean>
  balanceUSD: Maybe<number>
  tokenSymbolForNotification?: Nullable<string>
  // when we call this hook from the token list, we know if the account holds the token
  accountHoldsToken?: boolean
}

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

/**
 * Checks if a token balance should be hidden.
 *
 * @param hideSpamTokens - Indicates whether to hide spam tokens.
 * @param hideSmallBalances - Indicates whether to hide tokens with small balances.
 * @param isSpam - The spam status of the token, which could be undefined.
 * @param balanceUSD - The balance of the token in USD, which could be undefined.
 * @param tokenVisibility - Optional parameter that includes data about token's visibility.
 * @param isSentOrSwappedLocally - Indicates if the token has been sent or swapped locally.
 *
 * @returns {boolean} - Returns true if the token balance should be hidden, false otherwise.
 *
 * @example
 * const isHidden = isTokenBalanceHidden({ hideSpamTokens, hideSmallBalances, isSpam, balanceUSD });
 */
function isTokenBalanceHidden({
  hideSpamTokens,
  hideSmallBalances,
  isSpam,
  isNative,
  balanceUSD,
  tokenVisibility,
  isSentOrSwappedLocally,
}: {
  hideSpamTokens: boolean
  hideSmallBalances: boolean
  isSpam: Maybe<boolean>
  isNative: Maybe<boolean>
  balanceUSD: Maybe<number>
  tokenVisibility?: TokenVisibility
  isSentOrSwappedLocally: Maybe<boolean>
}): boolean {
  // If user has explicity set visibility then always follow their preference
  if (tokenVisibility !== undefined) return !tokenVisibility.isVisible

  // If the user has sent or swapped a given token before then do not hide it by default
  if (isSentOrSwappedLocally) return false

  const shouldHideSpam = hideSpamTokens && isSpam
  const isSmallBalance = !balanceUSD || balanceUSD < HIDE_SMALL_USD_BALANCES_THRESHOLD
  const shouldHideSmallBalance = hideSmallBalances && isSmallBalance && isNative === false

  // Hide a token by default if it is spam or a non-native token with a small balance
  return shouldHideSpam || shouldHideSmallBalance
}

function useAccountTokensVisibilitySettings(account: Address): {
  hideSpamTokens: boolean
  hideSmallBalances: boolean
  accountTokensVisibility?: Record<string, TokenVisibility>
  sentOrSwappedLocally: Record<string, boolean>
} {
  const hideSmallBalances = useSelectAccountHideSmallBalances(account)
  const hideSpamTokens = useSelectAccountHideSpamTokens(account)
  const sentOrSwappedLocally = useSelectLocalTxCurrencyIds(account)
  const tokensVisibility = useAppSelector(selectTokensVisibility)
  return {
    hideSmallBalances,
    hideSpamTokens,
    accountTokensVisibility: tokensVisibility[account],
    sentOrSwappedLocally,
  }
}

// Provide context menu related data for token
export function useTokenContextMenu({
  currencyId,
  isSpam,
  isNative,
  balanceUSD,
  tokenSymbolForNotification,
  accountHoldsToken,
}: TokenMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { hideSmallBalances, hideSpamTokens, accountTokensVisibility, sentOrSwappedLocally } =
    useAccountTokensVisibilitySettings(activeAccountAddress)
  const isHidden = isTokenBalanceHidden({
    tokenVisibility: accountTokensVisibility?.[currencyId],
    isSentOrSwappedLocally: sentOrSwappedLocally[currencyId],
    hideSpamTokens,
    hideSmallBalances,
    isSpam,
    isNative,
    balanceUSD,
  })

  const { data: balancesById } = usePortfolioBalances({
    // address === undefined means we skip the balances request inside usePortfolioBalances
    address: accountHoldsToken ? undefined : activeAccountAddress,
  })

  const activeAccountHoldsToken = accountHoldsToken || Boolean(balancesById?.[currencyId])

  const onPressShare = useCallback(async () => {
    const tokenUrl = getTokenUrl(currencyId)
    if (!tokenUrl) return
    try {
      await Share.share({
        message: tokenUrl,
      })
    } catch (error) {
      logger.error('Unable to share Token url', {
        tags: {
          file: 'balances/hooks.ts',
          function: 'onPressShare',
          error: serializeError(error),
        },
      })
    }
  }, [currencyId])

  const onPressHiddenStatus = useCallback(() => {
    dispatch(
      toggleTokenVisibility({
        accountAddress: activeAccountAddress,
        currencyId: currencyId.toLowerCase(),
        currentlyVisible: !isHidden,
      })
    )
    if (tokenSymbolForNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: !isHidden,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: tokenSymbolForNotification,
        })
      )
    }
  }, [activeAccountAddress, currencyId, dispatch, isHidden, tokenSymbolForNotification])

  const menuActions = useMemo(
    () => [
      ...(activeAccountHoldsToken
        ? [
            {
              title: isHidden ? t('Unhide Token') : t('Hide Token'),
              systemIcon: isHidden ? 'eye' : 'eye.slash',
              destructive: !isHidden,
              onPress: onPressHiddenStatus,
            },
          ]
        : []),
      {
        title: t('Share'),
        systemIcon: 'square.and.arrow.up',
        onPress: onPressShare,
      },
    ],
    [activeAccountHoldsToken, isHidden, t, onPressHiddenStatus, onPressShare]
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress }
}

/**
 * Custom hook to group Token Balances fetched from API to visible and hidden.
 *
 * @param balancesById - An object where keys are token ids and values are the corresponding balances. May be undefined.
 * @param owner - The owner address for which token balances are managed.
 *
 * @returns {object} An object containing two fields:
 *  - `tokens`: an array of tokens which could be a mix of PortfolioBalance instances or string (presumably token ids).
 *  - `numHidden`: the number of hidden tokens.
 *
 * @example
 * const { tokens, numHidden } = useGroupTokenBalancesByVisibility({ balancesById, expandHiddenTokens, owner });
 */
export function useTokenBalancesGroupedByVisibility({
  balancesById,
}: {
  balancesById?: Record<string, PortfolioBalance>
}): {
  shownTokens: Array<PortfolioBalance | string> | undefined
  hiddenTokens: Array<PortfolioBalance | string> | undefined
} {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { hideSmallBalances, hideSpamTokens, accountTokensVisibility, sentOrSwappedLocally } =
    useAccountTokensVisibilitySettings(activeAccountAddress)

  return useMemo(() => {
    if (!balancesById) return { shownTokens: undefined, hiddenTokens: undefined }

    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        const isHidden = isTokenBalanceHidden({
          tokenVisibility: accountTokensVisibility?.[balance.currencyInfo.currencyId],
          isSentOrSwappedLocally: sentOrSwappedLocally[balance.currencyInfo.currencyId],
          hideSpamTokens,
          hideSmallBalances,
          balanceUSD: balance.balanceUSD,
          isSpam: balance.currencyInfo.isSpam,
          isNative: balance.currencyInfo.currency.isNative,
        })

        if (isHidden) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }
        return acc
      },
      { shown: [], hidden: [] }
    )
    return {
      shownTokens: shown.length ? shown : undefined,
      hiddenTokens: hidden.length ? hidden : undefined,
      numHidden: hidden.length,
    }
  }, [
    balancesById,
    accountTokensVisibility,
    sentOrSwappedLocally,
    hideSpamTokens,
    hideSmallBalances,
  ])
}
