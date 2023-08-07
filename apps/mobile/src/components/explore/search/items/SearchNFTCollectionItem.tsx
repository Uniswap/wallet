import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import {
  addToSearchHistory,
  NFTCollectionSearchResult,
  SearchResultType,
} from 'src/features/explore/searchHistorySlice'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import VerifiedIcon from 'ui/src/assets/icons/verified.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

type NFTCollectionItemProps = {
  collection: NFTCollectionSearchResult
  searchContext?: SearchContext
}

export function SearchNFTCollectionItem({
  collection,
  searchContext,
}: NFTCollectionItemProps): JSX.Element {
  const theme = useAppTheme()
  const { name, address, chainId, isVerified, imageUrl } = collection
  const dispatch = useAppDispatch()
  const navigation = useAppStackNavigation()

  const onPress = (): void => {
    navigation.navigate(Screens.NFTCollection, {
      collectionAddress: address,
    })

    if (searchContext) {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        name,
        chain: chainId,
        address,
        type: 'collection',
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
        isHistory: searchContext.isHistory,
      })
    }

    dispatch(
      addToSearchHistory({
        searchResult: {
          type: SearchResultType.NFTCollection,
          chainId,
          address,
          name,
          imageUrl,
          isVerified,
        },
      })
    )
  }

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={ElementName.SearchNFTCollectionItem}
      onPress={onPress}>
      <Flex
        row
        alignItems="center"
        gap="spacing8"
        justifyContent="flex-start"
        px="spacing8"
        py="spacing12">
        <Flex
          centered
          borderRadius="roundedFull"
          height={iconSizes.icon40}
          mr="spacing4"
          overflow="hidden"
          width={iconSizes.icon40}>
          {imageUrl ? (
            <NFTViewer uri={imageUrl} />
          ) : (
            <Text color="textPrimary" numberOfLines={1} textAlign="center">
              {name.slice(0, 1)}
            </Text>
          )}
        </Flex>
        <Box flexShrink={1}>
          <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
            {name}
          </Text>
        </Box>
        <Flex grow alignItems="flex-start" width={theme.spacing.spacing36}>
          {isVerified ? (
            <VerifiedIcon
              color={theme.colors.userThemeMagenta}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          ) : null}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
