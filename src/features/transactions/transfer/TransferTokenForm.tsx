// TODO(MOB-3866): reduce component complexity
/* eslint-disable complexity */
import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { Text } from 'src/components/Text'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import {
  CurrencyField,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useOnToggleShowRecipientSelector,
} from 'src/features/transactions/transfer/hooks'
import { TransferFormSpeedbumps } from 'src/features/transactions/transfer/TransferFormWarnings'
import { createTransactionId } from 'src/features/transactions/utils'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useIsBlockedActiveAddress } from 'src/features/trm/hooks'
import { dimensions } from 'src/styles/sizing'
import { usePrevious } from 'src/utils/hooks'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
  warnings: Warning[]
  showingSelectorScreen: boolean
}

export interface TransferSpeedbump {
  hasWarning: boolean
  loading: boolean
}

export function TransferTokenForm({
  dispatch,
  derivedTransferInfo,
  onNext,
  warnings,
  showingSelectorScreen,
}: TransferTokenProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput = false,
    currencyInInfo,
    nftIn,
    chainId,
  } = derivedTransferInfo

  const currencyIn = currencyInInfo?.currency
  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const [currencyFieldFocused, setCurrencyFieldFocused] = useState(true)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showSpeedbumpModal, setShowSpeedbumpModal] = useState(false)
  const [transferSpeedbump, setTransferSpeedbump] = useState<TransferSpeedbump>({
    loading: true,
    hasWarning: false,
  })

  const { onShowTokenSelector, onSetExactAmount, onSetMax } = useSwapActionHandlers(dispatch)
  const onToggleShowRecipientSelector = useOnToggleShowRecipientSelector(dispatch)

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    transferSpeedbump.loading ||
    isBlocked ||
    isBlockedLoading

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    onNext()
  }, [dispatch, onNext])

  const onPressReview = useCallback(() => {
    if (transferSpeedbump.hasWarning) {
      setShowSpeedbumpModal(true)
    } else {
      goToNext()
    }
  }, [goToNext, transferSpeedbump.hasWarning])

  const onSetTransferSpeedbump = useCallback(({ hasWarning, loading }: TransferSpeedbump) => {
    setTransferSpeedbump({ hasWarning, loading })
  }, [])

  const onSetShowSpeedbumpModal = useCallback((showModal: boolean) => {
    setShowSpeedbumpModal(showModal)
  }, [])

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()

  const resetSelection = useCallback(
    (start: number, end?: number) => {
      setInputSelection({ start, end: end ?? start })
    },
    [setInputSelection]
  )

  const prevIsUSDInput = usePrevious(isUSDInput)

  // when text changes on the screen, the default iOS input behavior is to use the same cursor
  // position but from the END of the input. so for example, if the cursor is currently at
  // 12.3|4 and the input changes to $1.232354, then new cursor will be at $1.23235|4
  // this useEffect essentially calculates where the new cursor position is when the text has changed
  // and that only happens on toggling USD <-> token input
  useEffect(() => {
    // only run this useEffect if isUSDInput has changed
    // if inputSelection is undefined, then that means no text selection or cursor
    // movement has happened yet, so let iOS do its default thang
    if (isUSDInput === prevIsUSDInput || !inputSelection) return

    if (inputSelection.start !== inputSelection.end) {
      setInputSelection(undefined)
      return
    }

    const [prevInput, newInput] = isUSDInput
      ? [exactAmountToken, exactAmountUSD]
      : [exactAmountUSD, exactAmountToken]
    const positionFromEnd = prevInput.length - inputSelection.start
    const newPositionFromStart = newInput.length - positionFromEnd
    const newPositionFromStartWithPrefix = newPositionFromStart + (isUSDInput ? 1 : -1)

    setInputSelection({
      start: newPositionFromStartWithPrefix,
      end: newPositionFromStartWithPrefix,
    })
  }, [
    isUSDInput,
    prevIsUSDInput,
    inputSelection,
    setInputSelection,
    exactAmountToken,
    exactAmountUSD,
  ])

  const onTransferWarningClick = (): void => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const transferWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Low)
  const transferWarningColor = getAlertColor(transferWarning?.severity)

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const TRANSFER_DIRECTION_BUTTON_SIZE = theme.iconSizes.icon20
  const TRANSFER_DIRECTION_BUTTON_INNER_PADDING = theme.spacing.spacing12
  const TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH = theme.spacing.spacing4
  const SendWarningIcon = transferWarning?.icon ?? AlertTriangleIcon

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          confirmText={t('Close')}
          icon={
            <SendWarningIcon
              color={theme.colors[transferWarningColor.text]}
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          }
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onConfirm={(): void => setShowWarningModal(false)}
        />
      )}
      <TransferFormSpeedbumps
        chainId={chainId}
        dispatch={dispatch}
        recipient={recipient}
        setShowSpeedbumpModal={onSetShowSpeedbumpModal}
        setTransferSpeedbump={onSetTransferSpeedbump}
        showSpeedbumpModal={showSpeedbumpModal}
        onNext={goToNext}
      />
      <Flex grow gap="spacing8" justifyContent="space-between">
        <AnimatedFlex
          entering={FadeIn}
          exiting={FadeOut}
          gap="spacing2"
          onLayout={onInputPanelLayout}>
          {nftIn ? (
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 4} />
          ) : (
            <Box backgroundColor="background2" borderRadius="rounded20" justifyContent="center">
              <CurrencyInputPanel
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyInfo={currencyInInfo}
                focus={currencyFieldFocused}
                isOnScreen={!showingSelectorScreen}
                isUSDInput={isUSDInput}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={isUSDInput ? exactAmountUSD : exactAmountToken}
                warnings={warnings}
                onPressIn={(): void => setCurrencyFieldFocused(true)}
                onSelectionChange={
                  showNativeKeyboard
                    ? undefined
                    : (start, end): void => setInputSelection({ start, end })
                }
                onSetExactAmount={(value): void =>
                  onSetExactAmount(CurrencyField.INPUT, value, isUSDInput)
                }
                onSetMax={(amount): void => {
                  onSetMax(amount)
                  setCurrencyFieldFocused(false)
                }}
                onShowTokenSelector={(): void => onShowTokenSelector(CurrencyField.INPUT)}
              />
            </Box>
          )}

          <Box zIndex="popover">
            <Box
              alignItems="center"
              height={
                TRANSFER_DIRECTION_BUTTON_SIZE +
                TRANSFER_DIRECTION_BUTTON_INNER_PADDING +
                TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH
              }
              style={StyleSheet.absoluteFill}>
              <Box
                alignItems="center"
                bottom={TRANSFER_DIRECTION_BUTTON_SIZE / 2}
                position="absolute">
                <TransferArrowButton
                  disabled
                  bg={recipient ? 'background2' : 'background1'}
                  padding="spacing8"
                />
              </Box>
            </Box>
          </Box>

          <Box>
            <Flex
              backgroundColor={recipient ? 'background2' : 'none'}
              borderBottomLeftRadius={transferWarning || isBlocked ? 'none' : 'rounded20'}
              borderBottomRightRadius={transferWarning || isBlocked ? 'none' : 'rounded20'}
              borderTopLeftRadius="rounded20"
              borderTopRightRadius="rounded20"
              justifyContent="center"
              px="spacing16"
              py="spacing24">
              {recipient && (
                <RecipientInputPanel
                  recipientAddress={recipient}
                  onToggleShowRecipientSelector={onToggleShowRecipientSelector}
                />
              )}
            </Flex>
            {transferWarning && !isBlocked ? (
              <TouchableArea mt="spacing1" onPress={onTransferWarningClick}>
                <Flex
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor={transferWarningColor.background}
                  borderBottomLeftRadius="rounded16"
                  borderBottomRightRadius="rounded16"
                  flexGrow={1}
                  gap="spacing8"
                  px="spacing16"
                  py="spacing12">
                  <SendWarningIcon
                    color={theme.colors[transferWarningColor.text]}
                    height={theme.iconSizes.icon16}
                    strokeWidth={1.5}
                    width={theme.iconSizes.icon16}
                  />
                  <Text color={transferWarningColor.text} variant="subheadSmall">
                    {transferWarning.title}
                  </Text>
                </Flex>
              </TouchableArea>
            ) : null}
            {isBlocked ? (
              <BlockedAddressWarning
                row
                alignItems="center"
                alignSelf="stretch"
                backgroundColor="background2"
                borderBottomLeftRadius="rounded16"
                borderBottomRightRadius="rounded16"
                flexGrow={1}
                mt="spacing2"
                px="spacing16"
                py="spacing12"
              />
            ) : null}
          </Box>
        </AnimatedFlex>
        <AnimatedFlex
          bottom={0}
          exiting={FadeOutDown}
          gap="spacing8"
          left={0}
          opacity={isLayoutPending ? 0 : 1}
          position="absolute"
          right={0}
          onLayout={onDecimalPadLayout}>
          {!nftIn && !showNativeKeyboard && (
            <DecimalPad
              hasCurrencyPrefix={isUSDInput}
              resetSelection={resetSelection}
              selection={inputSelection}
              setValue={(newValue): void => {
                if (!currencyFieldFocused) return
                onSetExactAmount(CurrencyField.INPUT, newValue, isUSDInput)
              }}
              value={isUSDInput ? exactAmountUSD : exactAmountToken}
            />
          )}
          <Button
            disabled={actionButtonDisabled}
            label={t('Review transfer')}
            name={ElementName.ReviewTransfer}
            size={ButtonSize.Large}
            onPress={onPressReview}
          />
        </AnimatedFlex>
      </Flex>
    </>
  )
}
