import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { AnyAction } from '@reduxjs/toolkit'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { impactAsync } from 'expo-haptics'
import React, { Dispatch, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import SettingsIcon from 'src/assets/icons/settings.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import PlusMinusButton, { PlusMinusButtonType } from 'src/components/buttons/PlusMinusButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import {
  DEFAULT_SLIPPAGE_TOLERANCE,
  MAX_CUSTOM_SLIPPAGE_TOLERANCE,
} from 'src/constants/transactions'
import { SWAP_SLIPPAGE_HELP_PAGE_URL } from 'src/constants/urls'
import { ModalName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { slippageToleranceToPercent } from 'src/features/transactions/swap/utils'
import { transactionStateActions } from 'src/features/transactions/transactionState/transactionState'
import { opacify } from 'src/utils/colors'
import { formatCurrencyAmount, NumberType } from 'src/utils/format'
import { openUri } from 'src/utils/linking'

const SLIPPAGE_INCREMENT = 0.1

export type SwapSettingsModalProps = {
  derivedSwapInfo: DerivedSwapInfo
  dispatch: Dispatch<AnyAction>
  onClose?: () => void
}

export default function SwapSettingsModal({
  derivedSwapInfo,
  dispatch,
  onClose,
}: SwapSettingsModalProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    customSlippageTolerance,
    autoSlippageTolerance: derivedAutoSlippageTolerance,
    trade: tradeWithStatus,
  } = derivedSwapInfo
  const trade = tradeWithStatus.trade

  const [isEditingSlippage, setIsEditingSlippage] = useState<boolean>(false)
  const [autoSlippageEnabled, setAutoSlippageEnabled] = useState<boolean>(!customSlippageTolerance)
  const [inputSlippageTolerance, setInputSlippageTolerance] = useState<string>(
    customSlippageTolerance?.toFixed(2)?.toString() ?? ''
  )
  const [inputWarning, setInputWarning] = useState<string | undefined>()

  // Fall back to default slippage if there is no trade specified.
  // Separate from inputSlippageTolerance since autoSlippage updates when the trade quote updates
  const autoSlippageTolerance = derivedAutoSlippageTolerance ?? DEFAULT_SLIPPAGE_TOLERANCE

  // Determine numerical currentSlippage value to use based on inputSlippageTolerance string value
  // ex. if inputSlippageTolerance is '' or '.', currentSlippage is set to autoSlippageTolerance
  const parsedInputSlippageTolerance = parseFloat(inputSlippageTolerance)
  const currentSlippageToleranceNum = isNaN(parsedInputSlippageTolerance)
    ? autoSlippageTolerance
    : parsedInputSlippageTolerance

  // Make input text the warning color if user is setting custom slippage higher than auto slippage value or 0
  const showSlippageWarning = parsedInputSlippageTolerance > autoSlippageTolerance

  const inputShakeX = useSharedValue(0)
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShakeX.value }],
  }))

  const onPressLearnMore = (): void => {
    openUri(SWAP_SLIPPAGE_HELP_PAGE_URL)
  }

  const onPressAutoSlippage = (): void => {
    setAutoSlippageEnabled(true)
    setInputWarning(undefined)
    setInputSlippageTolerance('')
    dispatch(transactionStateActions.setCustomSlippageTolerance(undefined))
  }

  const onChangeSlippageInput = useCallback(
    (value: string): void => {
      setAutoSlippageEnabled(false)
      setInputWarning(undefined)

      // Handle keyboards that use `,` as decimal separator
      value = value.replace(',', '.')

      // Allow empty input value and single decimal point
      if (value === '' || value === '.') {
        setInputSlippageTolerance(value)
        return
      }

      const parsedValue = parseFloat(value)

      // Validate input and prevent invalid updates with animation
      const isInvalidNumber = isNaN(parsedValue)
      const overMaxTolerance = parsedValue > MAX_CUSTOM_SLIPPAGE_TOLERANCE
      const decimalParts = value.split('.')
      const moreThanOneDecimalSymbol = decimalParts.length > 2
      const moreThanTwoDecimals = decimalParts?.[1] && decimalParts?.[1].length > 2
      const isZero = parsedValue === 0

      if (isZero) {
        setInputWarning(t('Enter a value larger than 0'))
      }

      if (overMaxTolerance) {
        setInputWarning(
          t('Enter a value less than {{ maxSlippageTolerance }}', {
            maxSlippageTolerance: MAX_CUSTOM_SLIPPAGE_TOLERANCE,
          })
        )
        setInputSlippageTolerance('')
      }

      /* Prevent invalid updates to input value with animation and haptic
       * isZero is intentionally left out here because the user should be able to type "0"
       * without the input shaking (ex. typing 0.x shouldn't shake after typing char)
       */
      if (isInvalidNumber || overMaxTolerance || moreThanOneDecimalSymbol || moreThanTwoDecimals) {
        inputShakeX.value = withRepeat(
          withTiming(5, { duration: 50, easing: Easing.inOut(Easing.ease) }),
          3,
          true,
          () => {
            inputShakeX.value = 0
          }
        )
        impactAsync()
        return
      }

      setInputSlippageTolerance(value)
      dispatch(transactionStateActions.setCustomSlippageTolerance(parsedValue))
    },
    [dispatch, inputShakeX, t]
  )

  const onFocusSlippageInput = useCallback((): void => {
    setIsEditingSlippage(true)

    // Clear the input if auto slippage is enabled
    if (autoSlippageEnabled) {
      setAutoSlippageEnabled(false)
      setInputSlippageTolerance('')
    }
  }, [autoSlippageEnabled])

  const onBlurSlippageInput = useCallback(() => {
    setIsEditingSlippage(false)

    // Set autoSlippageEnabled to true if input is invalid (ex. '' or '.')
    if (isNaN(parsedInputSlippageTolerance)) {
      setAutoSlippageEnabled(true)
      dispatch(transactionStateActions.setCustomSlippageTolerance(undefined))
      return
    }

    setInputSlippageTolerance(parsedInputSlippageTolerance.toFixed(2))
  }, [parsedInputSlippageTolerance, dispatch])

  const onPressPlusMinusButton = useCallback(
    (type: PlusMinusButtonType): void => {
      if (autoSlippageEnabled) {
        setAutoSlippageEnabled(false)
      }

      const newSlippage =
        currentSlippageToleranceNum +
        (type === PlusMinusButtonType.Plus ? SLIPPAGE_INCREMENT : -SLIPPAGE_INCREMENT)
      const constrainedNewSlippage =
        type === PlusMinusButtonType.Plus
          ? Math.min(newSlippage, MAX_CUSTOM_SLIPPAGE_TOLERANCE)
          : Math.max(newSlippage, 0)

      if (constrainedNewSlippage === 0) {
        setInputWarning(t('Enter a value larger than 0'))
      } else {
        setInputWarning(undefined)
      }

      setInputSlippageTolerance(constrainedNewSlippage.toFixed(2).toString())
      dispatch(transactionStateActions.setCustomSlippageTolerance(constrainedNewSlippage))
    },
    [autoSlippageEnabled, currentSlippageToleranceNum, dispatch, t]
  )

  return (
    <BottomSheetModal name={ModalName.SwapSettings} onClose={onClose}>
      <Flex centered gap="spacing16" mb="spacing16" px="spacing24" py="spacing12">
        <Flex
          centered
          borderRadius="rounded12"
          p="spacing12"
          style={{
            backgroundColor: opacify(12, theme.colors.textTertiary),
          }}>
          <SettingsIcon
            color={theme.colors.textTertiary}
            height={theme.iconSizes.icon28}
            width={theme.iconSizes.icon28}
          />
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {t('Maximum slippage')}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {t(
            'Your transaction will revert if the price changes more than the slippage percentage.'
          )}{' '}
          <TouchableArea height={18} onPress={onPressLearnMore}>
            <Text color="accentActive" variant="buttonLabelSmall">
              {t('Learn more')}
            </Text>
          </TouchableArea>
        </Text>
        <Flex gap="spacing12">
          <Flex centered row mt="spacing12">
            <PlusMinusButton
              disabled={currentSlippageToleranceNum === 0}
              type={PlusMinusButtonType.Minus}
              onPress={onPressPlusMinusButton}
            />
            <AnimatedFlex
              row
              alignItems="center"
              bg={isEditingSlippage ? 'background2' : 'background0'}
              borderColor="backgroundOutline"
              borderRadius="roundedFull"
              borderWidth={1}
              gap="spacing12"
              p="spacing16"
              style={inputAnimatedStyle}>
              <TouchableArea hapticFeedback onPress={onPressAutoSlippage}>
                <Text color="accentAction" variant="buttonLabelSmall">
                  {t('Auto')}
                </Text>
              </TouchableArea>
              <BottomSheetTextInput
                keyboardType="numeric"
                style={{
                  color: autoSlippageEnabled
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                  fontSize: theme.textVariants.subheadLarge.fontSize,
                  fontFamily: theme.textVariants.subheadLarge.fontFamily,
                  width: theme.textVariants.subheadLarge.fontSize * 4,
                }}
                textAlign="center"
                value={
                  autoSlippageEnabled
                    ? autoSlippageTolerance.toFixed(2).toString()
                    : inputSlippageTolerance
                }
                onBlur={onBlurSlippageInput}
                onChangeText={onChangeSlippageInput}
                onFocus={onFocusSlippageInput}
              />
              <Box width={theme.iconSizes.icon28}>
                <Text color="textTertiary" textAlign="center" variant="subheadLarge">
                  %
                </Text>
              </Box>
            </AnimatedFlex>
            <PlusMinusButton
              disabled={currentSlippageToleranceNum === MAX_CUSTOM_SLIPPAGE_TOLERANCE}
              type={PlusMinusButtonType.Plus}
              onPress={onPressPlusMinusButton}
            />
          </Flex>
          <BottomLabel
            inputWarning={inputWarning}
            showSlippageWarning={showSlippageWarning}
            slippageTolerance={currentSlippageToleranceNum}
            trade={trade}
          />
        </Flex>
        <Flex centered row>
          <Button fill emphasis={ButtonEmphasis.Secondary} label={t('Close')} onPress={onClose} />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function BottomLabel({
  inputWarning,
  trade,
  slippageTolerance,
  showSlippageWarning,
}: {
  inputWarning?: string
  trade: Trade<Currency, Currency, TradeType> | null
  slippageTolerance: number
  showSlippageWarning: boolean
}): JSX.Element | null {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return (
      <Flex
        centered
        row
        gap="spacing8"
        height={theme.textVariants.bodySmall.lineHeight * 2 + theme.spacing.spacing8}>
        <AlertTriangleIcon
          color={theme.colors.accentWarning}
          height={theme.iconSizes.icon16}
          width={theme.iconSizes.icon16}
        />
        <Text color="accentWarning" textAlign="center" variant="bodySmall">
          {inputWarning}
        </Text>
      </Flex>
    )
  }

  return trade ? (
    <Flex
      centered
      gap="spacing8"
      height={theme.textVariants.bodySmall.lineHeight * 2 + theme.spacing.spacing8}>
      <Text color="textSecondary" textAlign="center" variant="bodySmall">
        {trade.tradeType === TradeType.EXACT_INPUT
          ? t('Receive at least {{amount}} {{symbol}}', {
              amount: formatCurrencyAmount(
                trade.minimumAmountOut(slippageTolerancePercent),
                NumberType.TokenTx
              ),
              symbol: trade.outputAmount.currency.symbol,
            })
          : t('Spend at most {{amount}} {{symbol}}', {
              amount: formatCurrencyAmount(
                trade.maximumAmountIn(slippageTolerancePercent),
                NumberType.TokenTx
              ),
              symbol: trade.inputAmount.currency.symbol,
            })}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="spacing8">
          <AlertTriangleIcon
            color={theme.colors.accentWarning}
            height={theme.iconSizes.icon16}
            width={theme.iconSizes.icon16}
          />
          <Text color="accentWarning" variant="bodySmall">
            {t('Slippage may be higher than necessary')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : (
    <Box height={theme.textVariants.bodySmall.lineHeight} />
  )
}
