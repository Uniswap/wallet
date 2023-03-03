import { SharedEventName } from '@uniswap/analytics-events'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AnimatedTouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Flex } from 'src/components/layout/Flex'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useFavoriteTokenCardQuery } from 'src/data/__generated__/types-and-hooks'
import { AssetType } from 'src/entities/assets'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { removeFavoriteToken } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { fromGraphQLChain } from 'src/utils/chainId'
import { formatUSDPrice } from 'src/utils/format'
import { usePollOnFocusOnly } from 'src/utils/hooks'

export const FAVORITE_TOKEN_CARD_LOADER_HEIGHT = 102

type FavoriteTokenCardProps = {
  currencyId: string
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

function FavoriteTokenCard({
  currencyId,
  isEditing,
  setIsEditing,
  ...rest
}: FavoriteTokenCardProps): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { data, networkStatus, startPolling, stopPolling } = useFavoriteTokenCardQuery({
    variables: currencyIdToContractInput(currencyId),
    // Rely on cache for fast favoriting UX, and poll for updates.
    fetchPolicy: 'cache-first',
    returnPartialData: true,
  })

  usePollOnFocusOnly(startPolling, stopPolling, PollingInterval.Fast)

  const token = data?.token

  // Mirror behavior in top tokens list, use first chain the token is on for the symbol
  const chainId = fromGraphQLChain(token?.chain)

  const usdPrice = token?.project?.markets?.[0]?.price?.value
  const pricePercentChange = token?.project?.markets?.[0]?.pricePercentChange24h?.value

  const onRemove = useCallback(() => {
    if (currencyId) {
      dispatch(removeFavoriteToken({ currencyId }))
    }
  }, [currencyId, dispatch])

  const navigateToSwapSell = useCallback(() => {
    if (!token?.address || !chainId) return

    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address: token.address,
        chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [chainId, dispatch, token?.address])

  const menuActions = useMemo(() => {
    return [
      { title: t('Remove favorite'), systemIcon: 'heart.fill' },
      { title: t('Edit favorites'), systemIcon: 'square.and.pencil' },
      { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
    ]
  }, [t])

  const onPress = (): void => {
    if (isEditing || !currencyId) return
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId, token?.name ?? undefined)
  }

  if (isNonPollingRequestInFlight(networkStatus)) {
    return <Loader.Favorite height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
  }

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: theme.borderRadii.rounded16 }}
      onPress={(e): void => {
        // Emitted index based on order of menu action array
        // remove favorite action
        if (e.nativeEvent.index === 0) {
          onRemove()
        }
        // Edit mode toggle action
        if (e.nativeEvent.index === 1) {
          setIsEditing(true)
        }
        // Swap token action
        if (e.nativeEvent.index === 2) {
          navigateToSwapSell()
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.Swap,
            section: SectionName.ExploreFavoriteTokensSection,
          })
        }
      }}
      {...rest}>
      <AnimatedTouchableArea
        hapticFeedback
        borderRadius="rounded16"
        entering={FadeIn}
        exiting={FadeOut}
        hapticStyle={ImpactFeedbackStyle.Light}
        m="spacing4"
        testID={`token-box-${token?.symbol}`}
        onPress={onPress}>
        <BaseCard.Shadow>
          <Flex alignItems="flex-start" gap="spacing8">
            <Flex row gap="spacing4" justifyContent="space-between">
              <Flex grow row alignItems="center" gap="spacing4">
                <TokenLogo
                  chainId={chainId ?? undefined}
                  size={theme.imageSizes.image20}
                  symbol={token?.symbol ?? undefined}
                  url={token?.project?.logoUrl ?? undefined}
                />
                <Text variant="bodyLarge">{token?.symbol}</Text>
              </Flex>
              {isEditing ? (
                <RemoveButton onPress={onRemove} />
              ) : (
                <Box height={theme.imageSizes.image24} />
              )}
            </Flex>
            <Flex gap="spacing2">
              <Text adjustsFontSizeToFit numberOfLines={1} variant="subheadLarge">
                {formatUSDPrice(usdPrice)}
              </Text>
              <RelativeChange
                arrowSize={theme.iconSizes.icon20}
                change={pricePercentChange ?? undefined}
                semanticColor={true}
                variant="subheadSmall"
              />
            </Flex>
          </Flex>
        </BaseCard.Shadow>
      </AnimatedTouchableArea>
    </ContextMenu>
  )
}

export default memo(FavoriteTokenCard)
