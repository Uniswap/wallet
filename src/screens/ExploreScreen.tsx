import { useScrollToTop } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput, useColorScheme } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { ExploreStackParamList } from 'src/app/navigation/types'
import { ExploreSections } from 'src/components/explore/ExploreSections'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName, SectionName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { Theme } from 'src/styles/theme'
import { useDebounce } from 'src/utils/timing'

type Props = NativeStackScreenProps<ExploreStackParamList, Screens.Explore>

export function ExploreScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useColorScheme() === 'dark'

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)

  const onChangeSearchFilter = (newSearchFilter: string): void => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = (): void => {
    setIsSearchMode(true)
    sendAnalyticsEvent(EventName.Impression, {
      section: SectionName.ExploreSearch,
      screen: Screens.Explore,
    })
  }

  const onSearchCancel = (): void => {
    setIsSearchMode(false)
  }

  // Reset search mode on tab press
  useEffect(() => {
    const parentNavigation = navigation.getParent()
    if (!parentNavigation) return
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore cannot figure out the right type here
    const unsubscribe = parentNavigation.addListener('tabPress', () => {
      textInputRef?.current?.clear()
      onSearchCancel()
    })
    return unsubscribe
  }, [navigation])

  // Handle special case with design system light colors because background1 is the same as background0
  const contrastBackgroundColor: keyof Theme['colors'] = isDarkMode ? 'background1' : 'background2'
  const searchBarBackgroundColor: keyof Theme['colors'] = isDarkMode ? 'background2' : 'background1'

  return (
    <Screen
      bg={isSearchMode ? 'background0' : 'backgroundBranded'}
      edges={['top', 'left', 'right']}>
      <Box p="spacing12">
        <SearchTextInput
          ref={textInputRef}
          showCancelButton
          backgroundColor={isSearchMode ? contrastBackgroundColor : searchBarBackgroundColor}
          placeholder={t('Search tokens and wallets')}
          showShadow={!isSearchMode}
          value={searchQuery}
          onCancel={onSearchCancel}
          onChangeText={onChangeSearchFilter}
          onFocus={onSearchFocus}
        />
      </Box>
      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flex.fill}>
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} mx="spacing16">
            <VirtualizedList>
              <Box p="spacing4" />
              {debouncedSearchQuery.length === 0 ? (
                <SearchEmptySection />
              ) : (
                <SearchResultsSection searchQuery={debouncedSearchQuery} />
              )}
            </VirtualizedList>
          </AnimatedFlex>
        </KeyboardAvoidingView>
      ) : (
        <ExploreSections listRef={listRef} />
      )}
    </Screen>
  )
}
