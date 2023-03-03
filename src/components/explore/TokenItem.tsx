import { SharedEventName } from '@uniswap/analytics-events'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'src/app/hooks'
import { RootState } from 'src/app/rootReducer'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenMetadata } from 'src/components/tokens/TokenMetadata'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { TokenMetadataDisplayType } from 'src/features/explore/types'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectHasFavoriteToken } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import {
  ElementName,
  MobileEventName,
  ModalName,
  SectionName,
} from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'src/utils/format'

const FAVORITE_ACTION_INDEX = 0
const SWAP_ACTION_INDEX = 1

export type TokenItemData = {
  name: string
  logoUrl: string
  chainId: ChainId
  address: Address | null
  symbol: string
  price?: number
  marketCap?: number
  pricePercentChange24h?: number
  volume24h?: number
  totalValueLocked?: number
}

interface TokenItemProps {
  tokenItemData: TokenItemData
  index: number
  metadataDisplayType?: TokenMetadataDisplayType
}

export const TokenItem = memo(({ tokenItemData, index, metadataDisplayType }: TokenItemProps) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const {
    name,
    logoUrl,
    chainId,
    address,
    symbol,
    price,
    marketCap,
    pricePercentChange24h,
    volume24h,
    totalValueLocked,
  } = tokenItemData
  const _currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  // Avoid referencing the entire favorite array, to minimize re-render to this token's inclusion only
  const isFavorited = useSelector((state: RootState) =>
    selectHasFavoriteToken(state, _currencyId.toLocaleLowerCase())
  )

  const toggleFavoriteToken = useToggleFavoriteCallback(_currencyId)

  const navigateToSwapSell = useCallback(() => {
    if (!address) return

    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address,
        chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [address, chainId, dispatch])

  const menuActions = useMemo(() => {
    return isFavorited
      ? [
          { title: t('Remove favorite'), systemIcon: 'heart.fill' },
          { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
        ]
      : [
          { title: 'Favorite token', systemIcon: 'heart' },
          { title: 'Swap', systemIcon: 'arrow.2.squarepath' },
        ]
  }, [isFavorited, t])

  const getMetadataSubtitle = (): string | undefined => {
    switch (metadataDisplayType) {
      case TokenMetadataDisplayType.MarketCap:
        return t('{{num}} MCap', { num: formatNumber(marketCap, NumberType.FiatTokenStats) })
      case TokenMetadataDisplayType.Volume:
        return t('{{num}} Vol', { num: formatNumber(volume24h, NumberType.FiatTokenStats) })
      case TokenMetadataDisplayType.TVL:
        return t('{{num}} TVL', {
          num: formatNumber(totalValueLocked, NumberType.FiatTokenStats),
        })
      case TokenMetadataDisplayType.Symbol:
        return symbol
    }
  }

  const onPress = (): void => {
    tokenDetailsNavigation.preload(_currencyId)
    tokenDetailsNavigation.navigate(_currencyId, name)
    sendAnalyticsEvent(MobileEventName.ExploreTokenItemSelected, {
      address: currencyIdToAddress(_currencyId),
      chain: currencyIdToChain(_currencyId) as number,
      name,
      position: index + 1,
    })
  }

  return (
    <ContextMenu
      actions={menuActions}
      onPress={(e): void => {
        // Emitted native index is based on order of options in the action array
        // Toggle favorite action
        if (e.nativeEvent.index === FAVORITE_ACTION_INDEX) {
          toggleFavoriteToken()
        }
        // Swap action
        if (e.nativeEvent.index === SWAP_ACTION_INDEX) {
          navigateToSwapSell()
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.Swap,
            section: SectionName.ExploreTopTokensSection,
          })
        }
      }}>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        testID={`token-item-${name}`}
        onPress={onPress}>
        <AnimatedFlex
          row
          alignItems="flex-start"
          justifyContent="space-between"
          px="spacing24"
          py="spacing8">
          <Flex centered row flexShrink={1} gap="spacing8" overflow="hidden">
            <Flex centered row gap="spacing4" overflow="hidden">
              {index !== undefined && (
                <Box minWidth={16}>
                  <Text color="textSecondary" variant="buttonLabelMicro">
                    {index + 1}
                  </Text>
                </Box>
              )}
              <TokenLogo symbol={symbol} url={logoUrl} />
            </Flex>
            <Flex alignItems="flex-start" flexShrink={1} gap="spacing2" ml="spacing4">
              <Text numberOfLines={1} variant="bodyLarge">
                {name}
              </Text>
              <Text color="textSecondary" variant="subheadSmall">
                {getMetadataSubtitle()}
              </Text>
            </Flex>
          </Flex>
          <Flex row alignItems="center" justifyContent="flex-end">
            <TokenMetadata>
              <Text variant="bodyLarge">{formatUSDPrice(price)}</Text>
              <RelativeChange change={pricePercentChange24h} variant="subheadSmall" />
            </TokenMetadata>
          </Flex>
        </AnimatedFlex>
      </TouchableArea>
    </ContextMenu>
  )
})
