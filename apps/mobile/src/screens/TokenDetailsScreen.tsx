import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { useCrossChainBalances } from 'src/components/TokenDetails/hooks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { useTokenContextMenu } from 'src/features/balances/hooks'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useNavigateToSend } from 'src/features/send/hooks'
import { useNavigateToSwap } from 'src/features/swap/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { useTokenWarningDismissed } from 'src/features/tokens/safetyHooks'
import { Screens } from 'src/screens/Screens'
import { useSkeletonLoading } from 'src/utils/useSkeletonLoading'
import {
  AnimatedFlex,
  Flex,
  Separator,
  Text,
  TouchableArea,
  useMedia,
  useSporeColors,
} from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import {
  SafetyLevel,
  TokenDetailsScreenQuery,
  useTokenDetailsScreenQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { useExtractedTokenColor } from 'wallet/src/utils/colors'
import { currencyIdToAddress, currencyIdToChain } from 'wallet/src/utils/currencyId'

function HeaderTitleElement({
  data,
  ellipsisMenuVisible,
}: {
  data: TokenDetailsScreenQuery | undefined
  ellipsisMenuVisible?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useFiatConverter()

  const onChainData = data?.token
  const offChainData = onChainData?.project

  const price = offChainData?.markets?.[0]?.price?.value ?? onChainData?.market?.price?.value
  const logo = offChainData?.logoUrl ?? undefined
  const symbol = onChainData?.symbol
  const chain = onChainData?.chain

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      ml={ellipsisMenuVisible ? '$spacing32' : '$none'}>
      <Text color="$neutral1" variant="body1">
        {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
      </Text>
      <Flex centered row gap="$spacing4">
        <TokenLogo
          chainId={fromGraphQLChain(chain) ?? undefined}
          size={iconSizes.icon16}
          symbol={symbol ?? undefined}
          url={logo}
        />
        <Text color="$neutral2" numberOfLines={1} variant="buttonLabel4">
          {symbol ?? t('Unknown token')}
        </Text>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsScreen({
  route,
  navigation,
}: AppStackScreenProp<Screens.TokenDetails>): JSX.Element {
  const { currencyId: _currencyId } = route.params
  // Potentially delays loading of perf-heavy content to speed up navigation
  const showSkeleton = useSkeletonLoading(navigation)

  // Token details screen query
  const { data, refetch, networkStatus } = useTokenDetailsScreenQuery({
    variables: currencyIdToContractInput(_currencyId),
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  })

  const retry = useCallback(async () => {
    await refetch(currencyIdToContractInput(_currencyId))
  }, [_currencyId, refetch])

  const isLoading = !data && isNonPollingRequestInFlight(networkStatus)

  // Preload token price graphs
  const { error: tokenPriceHistoryError } = useTokenPriceHistory(_currencyId)

  const traceProperties = useMemo(
    () => ({
      address: currencyIdToAddress(_currencyId),
      chain: currencyIdToChain(_currencyId),
      currencyName: data?.token?.project?.name,
    }),
    [_currencyId, data?.token?.project?.name]
  )

  return (
    <ReactNavigationPerformanceView interactive screenName={Screens.TokenDetails}>
      <Trace
        directFromPage
        logImpression
        properties={traceProperties}
        screen={Screens.TokenDetails}>
        <TokenDetails
          _currencyId={_currencyId}
          data={data}
          error={isError(networkStatus, !!data) || !!tokenPriceHistoryError}
          loading={isLoading}
          retry={retry}
          showSkeleton={showSkeleton}
        />
      </Trace>
    </ReactNavigationPerformanceView>
  )
}

function TokenDetails({
  _currencyId,
  data,
  error,
  retry,
  loading,
  showSkeleton,
}: {
  _currencyId: string
  data: TokenDetailsScreenQuery | undefined
  error: boolean
  retry: () => void
  loading: boolean
  showSkeleton: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const media = useMedia()
  const insets = useSafeAreaInsets()

  const currencyChainId = currencyIdToChain(_currencyId) ?? ChainId.Mainnet
  const currencyAddress = currencyIdToAddress(_currencyId)

  const token = data?.token
  const tokenLogoUrl = token?.project?.logoUrl

  const crossChainTokens = token?.project?.tokens
  const { currentChainBalance, otherChainBalances } = useCrossChainBalances(
    _currencyId,
    crossChainTokens
  )

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
    tokenLogoUrl,
    /*background=*/ colors.surface1.val,
    /*default=*/ colors.neutral3.val
  )

  const onPriceChartRetry = useCallback((): void => {
    if (!error) {
      return
    }
    retry()
  }, [error, retry])

  const navigateToSwap = useNavigateToSwap()
  const navigateToSend = useNavigateToSend()

  // set if attempting buy or sell, use for warning modal
  const [activeTransactionType, setActiveTransactionType] = useState<CurrencyField | undefined>(
    undefined
  )

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { tokenWarningDismissed, dismissWarningCallback } = useTokenWarningDismissed(_currencyId)

  const safetyLevel = token?.project?.safetyLevel

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      if (safetyLevel === SafetyLevel.Blocked) {
        setShowWarningModal(true)
        // show warning modal speed bump if token has a warning level and user has not dismissed
      } else if (safetyLevel !== SafetyLevel.Verified && !tokenWarningDismissed) {
        setActiveTransactionType(currencyField)
        setShowWarningModal(true)
      } else {
        setActiveTransactionType(undefined)
        navigateToSwap(currencyField, currencyAddress, currencyChainId)
      }
    },
    [currencyAddress, currencyChainId, navigateToSwap, safetyLevel, tokenWarningDismissed]
  )

  const onPressSend = useCallback(() => {
    // Do not show warning modal speedbump if user is trying to send tokens they own
    navigateToSend(currencyAddress, currencyChainId)
  }, [currencyAddress, currencyChainId, navigateToSend])

  const onAcceptWarning = useCallback(() => {
    dismissWarningCallback()
    setShowWarningModal(false)
    if (activeTransactionType !== undefined) {
      navigateToSwap(activeTransactionType, currencyAddress, currencyChainId)
    }
  }, [
    activeTransactionType,
    currencyAddress,
    currencyChainId,
    dismissWarningCallback,
    navigateToSwap,
  ])

  const pb = IS_IOS && !media.short ? '$spacing16' : '$none'

  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId: _currencyId,
    isSpam: currentChainBalance?.currencyInfo.isSpam,
    isNative: currentChainBalance?.currencyInfo.currency.isNative,
    balanceUSD: currentChainBalance?.balanceUSD,
    tokenSymbolForNotification: data?.token?.symbol,
  })

  const isDarkMode = useIsDarkMode()
  // shall be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? colors.neutral2.get() : colors.neutral2.get()
  const loadingColor = isDarkMode ? colors.neutral3.get() : colors.surface3.get()

  const ellipsisMenuVisible = menuActions.length > 0

  return (
    <Trace screen={Screens.TokenDetails}>
      <HeaderScrollScreen
        centerElement={<HeaderTitleElement data={data} ellipsisMenuVisible={ellipsisMenuVisible} />}
        renderedInModal={inModal}
        rightElement={
          <Flex row alignItems="center" gap="$spacing16">
            {ellipsisMenuVisible && (
              <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
                <TouchableArea
                  hapticFeedback
                  hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
                  style={{ padding: spacing.spacing8, marginRight: -spacing.spacing8 }}>
                  <EllipsisIcon
                    color={ellipsisColor}
                    height={iconSizes.icon16}
                    width={iconSizes.icon16}
                  />
                </TouchableArea>
              </ContextMenu>
            )}
            <TokenDetailsFavoriteButton currencyId={_currencyId} />
          </Flex>
        }
        showHandleBar={inModal}>
        <Flex gap="$spacing16" pb="$spacing16">
          <Flex gap="$spacing4">
            <TokenDetailsHeader
              data={data}
              loading={loading}
              onPressWarningIcon={(): void => setShowWarningModal(true)}
            />
            <PriceExplorer
              currencyId={_currencyId}
              forcePlaceholder={showSkeleton}
              tokenColor={tokenColorLoading ? loadingColor : tokenColor ?? colors.accent1.get()}
              onRetry={onPriceChartRetry}
            />
          </Flex>
          {error ? (
            <AnimatedFlex entering={FadeInDown} exiting={FadeOutDown} px="$spacing24">
              <BaseCard.InlineErrorState onRetry={retry} />
            </AnimatedFlex>
          ) : null}
          <Flex gap="$spacing16" mb="$spacing8" px="$spacing16">
            <TokenBalances
              currentChainBalance={currentChainBalance}
              otherChainBalances={otherChainBalances}
              onPressSend={onPressSend}
            />
            <Separator />
            {showSkeleton ? (
              <TokenDetailsTextPlaceholders />
            ) : (
              <>
                <TokenDetailsStats data={data} tokenColor={tokenColor} />
                <TokenDetailsLinks currencyId={_currencyId} data={data} />
              </>
            )}
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      {!loading && !tokenColorLoading ? (
        <AnimatedFlex
          backgroundColor="$surface1"
          entering={FadeInDown}
          pb={pb}
          style={{ marginBottom: IS_ANDROID ? insets.bottom : undefined }}>
          <TokenDetailsActionButtons
            tokenColor={tokenColor}
            onPressBuy={(): void => onPressSwap(CurrencyField.OUTPUT)}
            onPressSell={(): void => onPressSwap(CurrencyField.INPUT)}
          />
        </AnimatedFlex>
      ) : null}

      <TokenWarningModal
        currencyId={_currencyId}
        disableAccept={activeTransactionType === undefined}
        isVisible={showWarningModal}
        safetyLevel={safetyLevel}
        tokenLogoUrl={token?.project?.logoUrl}
        onAccept={onAcceptWarning}
        onClose={(): void => {
          setActiveTransactionType(undefined)
          setShowWarningModal(false)
        }}
      />
    </Trace>
  )
}

function TokenDetailsTextPlaceholders(): JSX.Element {
  return (
    <>
      <Flex>
        <Loader.Box height={fonts.subheading2.lineHeight} pb="$spacing4" width="100%" />
        <Loader.Box height={fonts.body2.lineHeight} width="100%" />
      </Flex>

      <Flex>
        <Loader.Box height={fonts.subheading2.lineHeight} pb="$spacing4" />
        <Flex gap="$spacing8">
          <Loader.Box height={fonts.body2.lineHeight} repeat={4} width="100%" />
        </Flex>
      </Flex>
    </>
  )
}
