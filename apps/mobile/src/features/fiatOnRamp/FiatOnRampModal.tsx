import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, TextInput, TextInputSelectionChangeEventData } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import {
  FadeIn,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useDynamicFontSizing, useShouldShowNativeKeyboard } from 'src/app/hooks'
import { AmountInput } from 'src/components/input/AmountInput'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { TextInputProps } from 'src/components/input/TextInput'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Pill } from 'src/components/text/Pill'
import { FiatOnRampTokenSelector } from 'src/components/TokenSelector/FiatOnRampTokenSelector'
import Trace from 'src/components/Trace/Trace'
import { FiatOnRampConnectingView } from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { useMoonpayFiatOnRamp } from 'src/features/fiatOnRamp/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { MobileEventProperties } from 'src/features/telemetry/types'
import { openUri } from 'src/utils/linking'
import {
  AnimatedFlex,
  Button,
  Flex,
  Icons,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useSporeColors,
} from 'ui/src'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useTimeout } from 'utilities/src/time/timing'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { ANIMATE_SPRING_CONFIG } from 'wallet/src/features/transactions/utils'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import { FiatOnRampCurrency } from './types'

const MOONPAY_UNSUPPORTED_REGION_HELP_URL =
  'https://support.uniswap.org/hc/en-us/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-'

const MAX_INPUT_FONT_SIZE = 56
const MIN_INPUT_FONT_SIZE = 32

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 40

const CONNECTING_TIMEOUT = 2000

export function FiatOnRampModal(): JSX.Element {
  const colors = useSporeColors()

  const dispatch = useAppDispatch()
  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.FiatOnRamp }))
  }, [dispatch])

  return (
    <BottomSheetModal
      fullScreen
      hideKeyboardOnDismiss
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRamp}
      onClose={onClose}>
      <FiatOnRampContent onClose={onClose} />
    </BottomSheetModal>
  )
}

function FiatOnRampContent({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const { formatNumberOrString } = useLocalizedFormatter()
  const inputRef = useRef<TextInput>(null)

  const { isSheetReady } = useBottomSheetContext()

  const [showConnectingToMoonpayScreen, setShowConnectingToMoonpayScreen] = useState(false)

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const [selection, setSelection] = useState<TextInputProps['selection']>()

  const resetSelection = (start: number, end?: number): void => {
    setSelection({ start, end: end ?? start })
  }

  const [value, setValue] = useState('')

  // We hardcode ETH as the starting currency
  const ethCurrencyInfo = useCurrencyInfo(
    buildCurrencyId(ChainId.Mainnet, getNativeAddress(ChainId.Mainnet))
  )

  const [currency, setCurrency] = useState<FiatOnRampCurrency>({
    currencyInfo: ethCurrencyInfo,
    moonpayCurrency: {
      code: 'eth',
      type: 'crypto',
      id: '',
      supportsLiveMode: true,
      supportsTestMode: true,
      isSupportedInUS: true,
      notAllowedUSStates: [],
    },
  })

  // We might not have ethCurrencyInfo when this component is initially rendered.
  // If `ethCurrencyInfo` becomes available later while currency.currencyInfo is still unset, we update the currency state accordingly.
  useEffect(() => {
    if (ethCurrencyInfo && !currency.currencyInfo) {
      setCurrency({ ...currency, currencyInfo: ethCurrencyInfo })
    }
  }, [currency, currency.currencyInfo, ethCurrencyInfo])

  const {
    eligible,
    quoteAmount,
    isLoading,
    isError,
    externalTransactionId,
    dispatchAddTransaction,
    fiatOnRampHostUrl,
    quoteCurrencyAmountReady,
    quoteCurrencyAmountLoading,
    errorText,
    errorColor,
  } = useMoonpayFiatOnRamp({
    baseCurrencyAmount: value,
    quoteCurrencyCode: currency.moonpayCurrency.code,
  })

  useTimeout(
    async () => {
      if (fiatOnRampHostUrl) {
        await openUri(fiatOnRampHostUrl)
        dispatchAddTransaction()
        onClose()
      }
    },
    // setTimeout would be called inside this hook, only when delay >= 0
    showConnectingToMoonpayScreen ? CONNECTING_TIMEOUT : -1
  )

  const buttonEnabled =
    !isLoading && (!eligible || (!isError && fiatOnRampHostUrl && quoteCurrencyAmountReady))

  const {
    onLayout: onInputLayout,
    fontSize,
    onSetFontSize,
  } = useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)

  const showSoftInputOnFocus = showNativeKeyboard && eligible

  const onSelectionChange = ({
    nativeEvent: {
      selection: { start, end },
    },
  }: NativeSyntheticEvent<TextInputSelectionChangeEventData>): void => {
    setSelection({ start, end })
  }

  const onChangeValue =
    (source: MobileEventProperties[MobileEventName.FiatOnRampAmountEntered]['source']) =>
    (newAmount: string): void => {
      sendMobileAnalyticsEvent(MobileEventName.FiatOnRampAmountEntered, {
        source,
      })
      onSetFontSize(newAmount)
      setValue(newAmount)
    }

  const [showTokenSelector, setShowTokenSelector] = useState(false)

  // hide keyboard when user goes to token selector screen
  useEffect(() => {
    if (showTokenSelector) {
      inputRef.current?.blur()
    } else if (showSoftInputOnFocus) {
      inputRef.current?.focus()
    }
  }, [showSoftInputOnFocus, showTokenSelector])

  const hideInnerContentRouter = showTokenSelector
  const screenXOffset = useSharedValue(hideInnerContentRouter ? -fullWidth : 0)

  useEffect(() => {
    const screenOffset = showTokenSelector ? 1 : 0
    screenXOffset.value = withSpring(-(fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showTokenSelector, fullWidth])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  const insets = useSafeAreaInsets()

  // we only show loading when there is no error text and value is not empty
  const selectTokenLoading = quoteCurrencyAmountLoading && !errorText && !!value

  return (
    <>
      {!showConnectingToMoonpayScreen && (
        <AnimatedFlex row height="100%" style={wrapperStyle}>
          {isSheetReady && (
            <AnimatedFlex
              entering={FadeIn}
              exiting={FadeOut}
              gap="$spacing16"
              pb="$spacing16"
              px="$spacing24"
              style={{ marginBottom: insets.bottom }}
              width="100%">
              <Text variant="subheading1">{t('Buy')}</Text>
              <Flex gap="$spacing16" onLayout={onInputPanelLayout}>
                <Flex
                  grow
                  alignItems="center"
                  gap="$spacing16"
                  justifyContent="center"
                  onLayout={onInputLayout}>
                  <AmountInput
                    ref={inputRef}
                    autoFocus
                    alignSelf="stretch"
                    backgroundColor="$transparent"
                    borderWidth={0}
                    caretHidden={!showNativeKeyboard}
                    fontFamily="$heading"
                    fontSize={fontSize}
                    maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
                    minHeight={MAX_INPUT_FONT_SIZE}
                    mt="$spacing48"
                    placeholder="$0"
                    placeholderTextColor="$neutral3"
                    px="$none"
                    py="$none"
                    returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
                    showCurrencySign={value !== ''}
                    showSoftInputOnFocus={showSoftInputOnFocus}
                    textAlign="center"
                    value={value}
                    onChangeText={onChangeValue('textInput')}
                    onSelectionChange={onSelectionChange}
                  />
                  {currency.currencyInfo && (
                    <SelectTokenButton
                      amount={quoteAmount}
                      disabled={!quoteCurrencyAmountReady}
                      loading={selectTokenLoading}
                      selectedCurrencyInfo={currency.currencyInfo}
                      onPress={(): void => {
                        setShowTokenSelector(true)
                      }}
                    />
                  )}
                  <Flex
                    /* We want to reserve the space here, so when error occurs - layout does not jump */
                    height={spacing.spacing24}>
                    {errorText && errorColor && (
                      <Text color={errorColor} textAlign="center" variant="buttonLabel4">
                        {errorText}
                      </Text>
                    )}
                  </Flex>
                  <Flex centered row gap="$spacing12" pb="$spacing16">
                    {['100', '300', '1000'].map((amount) => (
                      <PredefinedAmount
                        key={amount}
                        amount={amount}
                        currentAmount={value}
                        onPress={onChangeValue('chip')}
                      />
                    ))}
                  </Flex>
                </Flex>
              </Flex>
              <AnimatedFlex
                bottom={0}
                exiting={FadeOutDown}
                gap="$spacing8"
                left={0}
                opacity={isLayoutPending ? 0 : 1}
                pb="$spacing24"
                position="absolute"
                px="$spacing24"
                right={0}
                onLayout={onDecimalPadLayout}>
                {!showNativeKeyboard && (
                  <DecimalPad
                    resetSelection={resetSelection}
                    selection={selection}
                    setValue={onChangeValue('textInput')}
                    value={value}
                  />
                )}
                <MoonpayCtaButton
                  disabled={!buttonEnabled}
                  eligible={eligible}
                  isLoading={isLoading}
                  properties={{ externalTransactionId }}
                  onPress={async (): Promise<void> => {
                    if (eligible) {
                      setShowConnectingToMoonpayScreen(true)
                    } else {
                      await openUri(MOONPAY_UNSUPPORTED_REGION_HELP_URL)
                    }
                  }}
                />
              </AnimatedFlex>
            </AnimatedFlex>
          )}
          {showTokenSelector && (
            <FiatOnRampTokenSelector
              onBack={(): void => setShowTokenSelector(false)}
              onSelectCurrency={(newCurrency: FiatOnRampCurrency): void => {
                setCurrency(newCurrency)
                setShowTokenSelector(false)
              }}
            />
          )}
        </AnimatedFlex>
      )}
      {showConnectingToMoonpayScreen && (
        <FiatOnRampConnectingView
          amount={formatNumberOrString({
            value,
            type: NumberType.FiatTokenPrice,
            currencyCode: 'usd', // TODO remove hard-coded USD after adding support for more currencies
          })}
          quoteCurrencyCode={currency.currencyInfo?.currency.symbol}
        />
      )}
    </>
  )
}

interface MoonpayCtaButtonProps {
  onPress: () => void
  isLoading: boolean
  eligible: boolean
  disabled: boolean
  properties: Record<string, unknown>
}

function MoonpayCtaButton({
  isLoading,
  eligible,
  disabled,
  properties,
  onPress,
}: MoonpayCtaButtonProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <Trace
      logPress
      element={ElementName.FiatOnRampWidgetButton}
      pressEvent={MobileEventName.FiatOnRampWidgetOpened}
      properties={properties}>
      <Button
        disabled={disabled}
        icon={
          isLoading ? (
            <SpinningLoader color="$sporeWhite" />
          ) : !eligible ? (
            <Icons.InformationIcon />
          ) : undefined
        }
        size="large"
        theme={!isLoading && !eligible ? 'secondary' : 'primary'}
        onPress={onPress}>
        {isLoading
          ? undefined
          : eligible
          ? t('Continue to checkout')
          : t('Not supported in region')}
      </Button>
    </Trace>
  )
}

function PredefinedAmount({
  amount,
  onPress,
  currentAmount,
}: {
  amount: string
  currentAmount: string
  onPress: (amount: string) => void
}): JSX.Element {
  const colors = useSporeColors()
  const highlighted = currentAmount === amount
  return (
    <TouchableOpacity onPress={(): void => onPress(amount)}>
      <Pill
        backgroundColor={highlighted ? '$DEP_backgroundActionButton' : '$surface2'}
        foregroundColor={colors[highlighted ? 'accent1' : 'neutral2'].val}
        label={`$${amount}`}
        px="$spacing16"
        textVariant="buttonLabel3"
      />
    </TouchableOpacity>
  )
}

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo: CurrencyInfo
  amount: number
  disabled?: boolean
  loading?: boolean
}

function SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  amount,
  disabled,
  loading,
}: SelectTokenButtonProps): JSX.Element {
  const textColor = disabled ? '$neutral3' : '$neutral2'

  return (
    <TouchableArea
      hapticFeedback
      borderRadius="$roundedFull"
      testID={ElementName.TokenSelectorToggle}
      onPress={onPress}>
      <Flex centered row flexDirection="row" gap="$spacing4" p="$spacing4">
        {loading ? (
          <SpinningLoader />
        ) : (
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon24} />
        )}
        <Text color={textColor} pl="$spacing4" variant="body1">
          {amount}
        </Text>
        <Text color={textColor} pl="$spacing1" variant="body1">
          {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
        </Text>
        <Icons.RotatableChevron color={textColor} direction="e" height={iconSizes.icon16} />
      </Flex>
    </TouchableArea>
  )
}
