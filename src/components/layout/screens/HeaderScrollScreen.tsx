import { useScrollToTop } from '@react-navigation/native'
import React, { PropsWithChildren, useRef } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { ScrollHeader } from 'src/components/layout/screens/ScrollHeader'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { HandleBar } from 'src/components/modals/HandleBar'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'

// Distance to scroll to show scrolled state header elements
const SHOW_HEADER_SCROLL_Y_DISTANCE = 50

type HeaderScrollScreenProps = {
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  alwaysShowCenterElement?: boolean
  fullScreen?: boolean // Expand to device edges
  renderedInModal?: boolean // Apply styling to display within bottom sheet modal
  showHandleBar?: boolean // add handlebar element to top of view
}

export function HeaderScrollScreen({
  centerElement,
  rightElement = <Box width={FixedTheme.iconSizes.icon24} />,
  alwaysShowCenterElement,
  fullScreen = false,
  renderedInModal = false,
  showHandleBar = false,
  children,
}: PropsWithChildren<HeaderScrollScreenProps>): JSX.Element {
  const theme = useAppTheme()

  // difficult to properly type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<FlatList<any>>(null)

  // scrolls to top when tapping on the active tab
  useScrollToTop(listRef)

  const scrollY = useSharedValue(0)

  // On scroll, centerElement and the bottom border fade in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(event.contentOffset.y > 0 ? SHOW_HEADER_SCROLL_Y_DISTANCE : 0)
    },
  })

  return (
    <Screen edges={fullScreen ? EMPTY_ARRAY : ['top', 'left', 'right']}>
      {showHandleBar ? <HandleBar backgroundColor={theme.colors.background0} /> : null}
      <ScrollHeader
        alwaysShowCenterElement={alwaysShowCenterElement}
        centerElement={centerElement}
        fullScreen={fullScreen}
        listRef={listRef}
        rightElement={rightElement}
        scrollY={scrollY}
        showHeaderScrollYDistance={SHOW_HEADER_SCROLL_Y_DISTANCE}
      />
      <VirtualizedList
        ref={listRef}
        contentContainerStyle={flex.grow}
        renderedInModal={renderedInModal}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={flex.fill}
        onScroll={scrollHandler}>
        {children}
      </VirtualizedList>

      <HorizontalEdgeGestureTarget />
    </Screen>
  )
}
