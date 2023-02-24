import { useScrollToTop } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import * as SplashScreen from 'expo-splash-screen'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import DollarIcon from 'src/assets/icons/buy.svg'
import ReceiveArrow from 'src/assets/icons/receive.svg'
import SendIcon from 'src/assets/icons/send-action.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { ActivityTab } from 'src/components/home/ActivityTab'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import { Screen } from 'src/components/layout/Screen'
import {
  HeaderConfig,
  renderTabLabel,
  ScrollPair,
  TabContentProps,
  TAB_BAR_HEIGHT,
  TAB_STYLES,
  TAB_VIEW_SCROLL_THROTTLE,
  useScrollSync,
} from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import TraceTabView from 'src/components/telemetry/TraceTabView'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { useFiatOnRampEnabled } from 'src/features/experiments/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, EventName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { useTimeout } from 'src/utils/timing'

const CONTENT_HEADER_HEIGHT_ESTIMATE = 270

/**
 * Home Screen hosts both Tokens and NFTs Tab
 * Manages TokensTabs and NftsTab scroll offsets when header is collapsed
 * Borrowed from: https://stormotion.io/blog/how-to-create-collapsing-tab-header-using-react-native/
 */
export function HomeScreen(): JSX.Element {
  // imports test account for easy development/testing
  useTestAccount()
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

  const [tabIndex, setTabIndex] = useState(0)
  const routes = useMemo(
    () => [
      { key: SectionName.HomeTokensTab, title: t('Tokens') },
      { key: SectionName.HomeNFTsTab, title: t('NFTs') },
      { key: SectionName.HomeActivityTab, title: t('Activity') },
    ],
    [t]
  )

  const [headerHeight, setHeaderHeight] = useState(CONTENT_HEADER_HEIGHT_ESTIMATE)
  const headerConfig = useMemo<HeaderConfig>(
    () => ({
      heightCollapsed: insets.top,
      heightExpanded: headerHeight,
    }),
    [headerHeight, insets.top]
  )
  const { heightCollapsed, heightExpanded } = headerConfig
  const headerHeightDiff = heightExpanded - heightCollapsed

  const handleHeaderLayout = useCallback<NonNullable<ViewProps['onLayout']>>(
    (event) => setHeaderHeight(event.nativeEvent.layout.height),
    []
  )

  const tokensTabScrollValue = useSharedValue(0)
  const tokensTabScrollHandler = useAnimatedScrollHandler(
    (event) => (tokensTabScrollValue.value = event.contentOffset.y)
  )
  const nftsTabScrollValue = useSharedValue(0)
  const nftsTabScrollHandler = useAnimatedScrollHandler(
    (event) => (nftsTabScrollValue.value = event.contentOffset.y)
  )
  const activityTabScrollValue = useSharedValue(0)
  const activityTabScrollHandler = useAnimatedScrollHandler(
    (event) => (activityTabScrollValue.value = event.contentOffset.y)
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokensTabScrollRef = useAnimatedRef<FlashList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nftsTabScrollRef = useAnimatedRef<FlashList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activityTabScrollRef = useAnimatedRef<FlashList<any>>()

  const сurrentScrollValue = useDerivedValue(() => {
    if (tabIndex === 0) {
      return tokensTabScrollValue.value
    } else if (tabIndex === 1) {
      return nftsTabScrollValue.value
    }
    return activityTabScrollValue.value
  }, [tabIndex])

  // If accounts are switched, we want to scroll to top and show full header
  useEffect(() => {
    nftsTabScrollValue.value = 0
    tokensTabScrollValue.value = 0
    activityTabScrollValue.value = 0
    nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [
    activeAccount,
    activityTabScrollRef,
    activityTabScrollValue,
    nftsTabScrollRef,
    nftsTabScrollValue,
    tokensTabScrollRef,
    tokensTabScrollValue,
  ])

  // Need to create a derived value for tab index so it can be referenced from a static ref
  const currentTabIndex = useDerivedValue(() => tabIndex, [tabIndex])
  const isNftTabsAtTop = useDerivedValue(() => nftsTabScrollValue.value === 0)
  const isActivityTabAtTop = useDerivedValue(() => activityTabScrollValue.value === 0)

  useScrollToTop(
    useRef({
      scrollToTop: () => {
        if (currentTabIndex.value === 1 && isNftTabsAtTop.value) {
          setTabIndex(0)
        } else if (currentTabIndex.value === 1) {
          nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else if (currentTabIndex.value === 2 && isActivityTabAtTop.value) {
          setTabIndex(1)
        } else if (currentTabIndex.value === 2) {
          activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else {
          tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        }
      },
    })
  )
  const translateY = useDerivedValue(() => {
    const offset = -Math.min(сurrentScrollValue.value, headerHeightDiff)
    return offset > 0 ? 0 : offset
  })

  const translatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const scrollPairs = useMemo<ScrollPair[]>(
    () => [
      { list: tokensTabScrollRef, position: tokensTabScrollValue, index: 0 },
      { list: nftsTabScrollRef, position: nftsTabScrollValue, index: 1 },
      { list: activityTabScrollRef, position: activityTabScrollValue, index: 2 },
    ],
    [
      activityTabScrollRef,
      activityTabScrollValue,
      nftsTabScrollRef,
      nftsTabScrollValue,
      tokensTabScrollRef,
      tokensTabScrollValue,
    ]
  )

  const { sync } = useScrollSync(tabIndex, scrollPairs, headerConfig)

  const contentHeader = useMemo(() => {
    return (
      <Flex bg="background0" gap="spacing16" pb="spacing16" px="spacing24">
        <Box pb="spacing4">
          <AccountHeader />
        </Box>
        <Box pb="spacing4">
          <PortfolioBalance owner={activeAccount.address} />
        </Box>
        <QuickActions />
      </Flex>
    )
  }, [activeAccount.address])

  const contentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: headerHeight + TAB_BAR_HEIGHT + TAB_STYLES.tabListInner.paddingTop,
      paddingBottom: insets.bottom,
      minHeight: dimensions.fullHeight + headerHeightDiff,
    }),
    [headerHeight, insets.bottom, headerHeightDiff]
  )

  const loadingContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: headerHeight + TAB_BAR_HEIGHT + TAB_STYLES.tabListInner.paddingTop,
      paddingBottom: insets.bottom,
    }),
    [headerHeight, insets.bottom]
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      loadingContainerStyle,
      contentContainerStyle,
      onMomentumScrollEnd: sync,
      onScrollEndDrag: sync,
      scrollEventThrottle: TAB_VIEW_SCROLL_THROTTLE,
    }),
    [contentContainerStyle, loadingContainerStyle, sync]
  )

  const tabBarStyle = useMemo<StyleProp<ViewStyle>>(
    () => [{ top: headerHeight }, translatedStyle],
    [headerHeight, translatedStyle]
  )

  const headerContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [TAB_STYLES.headerContainer, { paddingTop: insets.top }, translatedStyle],
    [insets.top, translatedStyle]
  )

  const statusBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      сurrentScrollValue.value,
      [0, headerHeightDiff],
      [theme.colors.background0, theme.colors.background0]
    ),
  }))

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      const style = { width: 'auto' }
      return (
        <>
          <Animated.View style={headerContainerStyle} onLayout={handleHeaderLayout}>
            {contentHeader}
          </Animated.View>
          <Animated.View style={[TAB_STYLES.header, tabBarStyle]}>
            <Box bg="background0" paddingLeft="spacing12">
              <TabBar
                {...sceneProps}
                indicatorStyle={TAB_STYLES.activeTabIndicator}
                navigationState={{ index: tabIndex, routes }}
                renderLabel={renderTabLabel}
                style={[
                  TAB_STYLES.tabBar,
                  {
                    backgroundColor: theme.colors.background0,
                    borderBottomColor: theme.colors.backgroundOutline,
                  },
                ]}
                tabStyle={style}
              />
            </Box>
          </Animated.View>
        </>
      )
    },
    [
      contentHeader,
      handleHeaderLayout,
      headerContainerStyle,
      routes,
      tabBarStyle,
      tabIndex,
      theme.colors.background0,
      theme.colors.backgroundOutline,
    ]
  )

  const renderTab = useCallback(
    ({ route }) => {
      switch (route?.key) {
        case SectionName.HomeTokensTab:
          return (
            <TokensTab
              ref={tokensTabScrollRef}
              containerProps={sharedProps}
              owner={activeAccount?.address}
              scrollHandler={tokensTabScrollHandler}
            />
          )
        case SectionName.HomeNFTsTab:
          return (
            <NftsTab
              ref={nftsTabScrollRef}
              containerProps={sharedProps}
              owner={activeAccount?.address}
              scrollHandler={nftsTabScrollHandler}
            />
          )
        case SectionName.HomeActivityTab:
          return (
            <ActivityTab
              ref={activityTabScrollRef}
              containerProps={sharedProps}
              owner={activeAccount?.address}
              scrollHandler={activityTabScrollHandler}
            />
          )
      }
      return null
    },
    [
      activeAccount?.address,
      activityTabScrollHandler,
      activityTabScrollRef,
      nftsTabScrollHandler,
      nftsTabScrollRef,
      sharedProps,
      tokensTabScrollHandler,
      tokensTabScrollRef,
    ]
  )

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(SplashScreen.hideAsync, 1)

  return (
    <Screen edges={['left', 'right']}>
      <View style={TAB_STYLES.container}>
        <TraceTabView
          initialLayout={{
            height: dimensions.fullHeight,
            width: dimensions.fullWidth,
          }}
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderTab}
          renderTabBar={renderTabBar}
          screenName={Screens.Home}
          onIndexChange={setTabIndex}
        />
      </View>
      <AnimatedBox
        height={insets.top}
        position="absolute"
        style={statusBarStyle}
        top={0}
        width="100%"
        zIndex="sticky"
      />
    </Screen>
  )
}

function QuickActions(): JSX.Element {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()

  const { t } = useTranslation()

  const onPressBuy = (): void => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  const onPressReceive = (): void => {
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const onPressSend = useCallback(() => {
    dispatch(openModal({ name: ModalName.Send }))
  }, [dispatch])

  // hide fiat onramp banner when active account isn't a signer account.
  const fiatOnRampShown =
    useFiatOnRampEnabled() && activeAccount.type === AccountType.SignerMnemonic

  return (
    <Flex centered row gap="spacing8">
      {fiatOnRampShown ? (
        <ActionButton
          Icon={DollarIcon}
          eventName={EventName.FiatOnRampQuickActionButtonPressed}
          label={t('Buy')}
          name={ElementName.Buy}
          onPress={onPressBuy}
        />
      ) : null}
      <ActionButton
        Icon={SendIcon}
        label={t('Send')}
        name={ElementName.Send}
        onPress={onPressSend}
      />
      <ActionButton
        Icon={ReceiveArrow}
        label={t('Receive')}
        name={ElementName.Receive}
        onPress={onPressReceive}
      />
    </Flex>
  )
}

function ActionButton({
  eventName,
  name,
  label,
  Icon,
  onPress,
}: {
  eventName?: EventName
  name: ElementName
  label: string
  Icon: React.FC<SvgProps>
  onPress: () => void
}): JSX.Element {
  const theme = useAppTheme()

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor="background2"
      borderRadius="rounded24"
      eventName={eventName}
      flex={1}
      name={name}
      padding="spacing12"
      shadowColor="white"
      shadowOffset={SHADOW_OFFSET_SMALL}
      shadowOpacity={0.1}
      shadowRadius={6}
      onPress={onPress}>
      <Flex centered row gap="spacing4">
        <Icon
          color={theme.colors.magentaVibrant}
          height={theme.iconSizes.icon20}
          strokeWidth={2}
          width={theme.iconSizes.icon20}
        />
        <Text color="textPrimary" variant="bodyLarge">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
