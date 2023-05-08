import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import ClockIcon from 'src/assets/icons/clock.svg'
import TrendArrowIcon from 'src/assets/icons/trend-up.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SearchPopularNFTCollections } from 'src/components/explore/search/SearchPopularNFTCollections'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { renderSearchItem } from 'src/components/explore/search/SearchResultsSection'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import {
  clearSearchHistory,
  SearchResultType,
  selectSearchHistory,
  WalletSearchResult,
} from 'src/features/explore/searchHistorySlice'

export const SUGGESTED_WALLETS: WalletSearchResult[] = [
  {
    type: SearchResultType.Wallet,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ensName: 'vitalik.eth',
  },
  {
    type: SearchResultType.Wallet,
    address: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    ensName: 'hayden.eth',
  },
]

export function SearchEmptySection(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const searchHistory = useAppSelector(selectSearchHistory)

  const onPressClearSearchHistory = (): void => {
    dispatch(clearSearchHistory())
  }

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="spacing12">
      {searchHistory.length > 0 && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
          <FlatList
            ListHeaderComponent={
              <Flex row alignItems="center" justifyContent="space-between" mb="spacing4">
                <SectionHeaderText icon={<RecentIcon />} title={t('Recent searches')} />
                <TouchableArea onPress={onPressClearSearchHistory}>
                  <Text color="accentAction" variant="buttonLabelSmall">
                    {t('Clear all')}
                  </Text>
                </TouchableArea>
              </Flex>
            }
            data={searchHistory}
            renderItem={(props): JSX.Element | null =>
              renderSearchItem({ ...props, searchContext: { isHistory: true } })
            }
          />
        </AnimatedFlex>
      )}
      <Flex gap="spacing4">
        <SectionHeaderText icon={<TrendIcon />} title={t('Popular tokens')} />
        <SearchPopularTokens />
      </Flex>
      <Flex gap="spacing4">
        <SectionHeaderText icon={<TrendIcon />} title={t('Popular NFT collections')} />
        <SearchPopularNFTCollections />
      </Flex>
      <FlatList
        ListHeaderComponent={
          <SectionHeaderText icon={<TrendIcon />} title={t('Suggested wallets')} />
        }
        data={SUGGESTED_WALLETS}
        keyExtractor={walletKey}
        listKey="wallets"
        renderItem={renderSearchItem}
      />
    </AnimatedFlex>
  )
}

const walletKey = (wallet: WalletSearchResult): string => {
  return wallet.address
}

export const TrendIcon = (): JSX.Element => {
  const theme = useAppTheme()
  return <TrendArrowIcon color={theme.colors.textSecondary} width={theme.iconSizes.icon20} />
}

export const RecentIcon = (): JSX.Element => {
  const theme = useAppTheme()
  return (
    <ClockIcon
      color={theme.colors.textSecondary}
      height={theme.iconSizes.icon20}
      width={theme.iconSizes.icon20}
    />
  )
}
