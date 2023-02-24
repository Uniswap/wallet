import { AnyAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import React, { Dispatch, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import DollarSign from 'src/assets/icons/dollar.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Warning, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo, useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferReview } from 'src/features/transactions/transfer/TransferReview'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { TransferTokenForm } from 'src/features/transactions/transfer/TransferTokenForm'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { dimensions } from 'src/styles/sizing'
import { ANIMATE_SPRING_CONFIG } from './utils'

export enum TransactionStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

interface TransactionFlowProps {
  dispatch: Dispatch<AnyAction>
  showTokenSelector: boolean
  showRecipientSelector?: boolean
  tokenSelector: JSX.Element
  recipientSelector?: JSX.Element
  flowName: string
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
  onClose: () => void
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  totalGasFee?: string
  gasFallbackUsed?: boolean
  step: TransactionStep
  setStep: (newStep: TransactionStep) => void
  warnings: Warning[]
  exactValue: string
  isUSDInput?: boolean
  showUSDToggle?: boolean
}

type InnerContentProps = Pick<
  TransactionFlowProps,
  | 'derivedInfo'
  | 'onClose'
  | 'dispatch'
  | 'totalGasFee'
  | 'gasFallbackUsed'
  | 'txRequest'
  | 'approveTxRequest'
  | 'warnings'
  | 'exactValue'
> & {
  step: number
  setStep: (step: TransactionStep) => void
  showingSelectorScreen: boolean
}

function isSwapInfo(
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
): derivedInfo is DerivedSwapInfo {
  return (derivedInfo as DerivedSwapInfo).trade !== undefined
}

export function TransactionFlow({
  flowName,
  showTokenSelector,
  showRecipientSelector,
  tokenSelector,
  recipientSelector,
  derivedInfo,
  approveTxRequest,
  txRequest,
  totalGasFee,
  gasFallbackUsed,
  step,
  setStep,
  onClose,
  dispatch,
  warnings,
  exactValue,
  isUSDInput,
  showUSDToggle,
}: TransactionFlowProps): JSX.Element {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const account = useActiveAccountWithThrow()
  const { t } = useTranslation()

  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)
  const isSwap = isSwapInfo(derivedInfo)
  const hideInnerContentRouter = showTokenSelector || showRecipientSelector

  // optimisation for not rendering InnerContent initially,
  // when modal is opened with recipient or token selector presented
  const [renderInnerContentRouter, setRenderInnerContentRouter] = useState(!hideInnerContentRouter)
  useEffect(() => {
    setRenderInnerContentRouter(renderInnerContentRouter || !hideInnerContentRouter)
  }, [showTokenSelector, showRecipientSelector, renderInnerContentRouter, hideInnerContentRouter])

  const screenXOffset = useSharedValue(hideInnerContentRouter ? -dimensions.fullWidth : 0)
  useEffect(() => {
    const screenOffset = hideInnerContentRouter ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showTokenSelector, showRecipientSelector, hideInnerContentRouter])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  const { onToggleUSDInput } = useSwapActionHandlers(dispatch)

  return (
    <TouchableWithoutFeedback>
      <AnimatedFlex grow row gap="none" height="100%" style={wrapperStyle}>
        <Flex
          gap="spacing16"
          pb="spacing16"
          px="spacing16"
          style={{ marginBottom: insets.bottom }}
          width="100%">
          {step !== TransactionStep.SUBMITTED && (
            <Flex
              row
              alignItems="center"
              justifyContent="space-between"
              pt="spacing8"
              px="spacing12">
              <Text textAlign="left" variant={{ xs: 'subheadSmall', sm: 'subheadLarge' }}>
                {flowName}
              </Text>
              <Flex row gap="spacing4">
                {step === TransactionStep.FORM && showUSDToggle ? (
                  <TouchableArea
                    hapticFeedback
                    bg={isUSDInput ? 'accentActionSoft' : 'background2'}
                    borderRadius="rounded16"
                    px="spacing8"
                    py="spacing4"
                    onPress={(): void => onToggleUSDInput(!isUSDInput)}>
                    <Flex row alignItems="center" gap="spacing4">
                      <DollarSign
                        color={isUSDInput ? theme.colors.accentAction : theme.colors.textSecondary}
                        height={theme.iconSizes.icon16}
                        width={theme.iconSizes.icon16}
                      />
                      <Text
                        color={isUSDInput ? 'accentAction' : 'textSecondary'}
                        variant="buttonLabelSmall">
                        {t('USD')}
                      </Text>
                    </Flex>
                  </TouchableArea>
                ) : null}
                {account?.type === AccountType.Readonly ? (
                  <TouchableArea
                    bg="background2"
                    borderRadius="rounded12"
                    justifyContent="center"
                    px="spacing8"
                    py="spacing4"
                    onPress={(): void => setShowViewOnlyModal(true)}>
                    <Flex row alignItems="center" gap="spacing4">
                      <EyeIcon
                        color={theme.colors.textTertiary}
                        height={theme.iconSizes.icon16}
                        width={theme.iconSizes.icon16}
                      />
                      <Text color="textTertiary" variant="buttonLabelSmall">
                        {t('View-only')}
                      </Text>
                    </Flex>
                  </TouchableArea>
                ) : null}
              </Flex>
            </Flex>
          )}
          {renderInnerContentRouter && (
            <InnerContentRouter
              approveTxRequest={approveTxRequest}
              derivedInfo={derivedInfo}
              dispatch={dispatch}
              exactValue={exactValue}
              gasFallbackUsed={gasFallbackUsed}
              setStep={setStep}
              showingSelectorScreen={showRecipientSelector || showTokenSelector}
              step={step}
              totalGasFee={totalGasFee}
              txRequest={txRequest}
              warnings={warnings}
              onClose={onClose}
            />
          )}
        </Flex>
        {showViewOnlyModal && (
          <WarningModal
            caption={
              isSwap
                ? t('You need to import this wallet via recovery phrase to swap tokens.')
                : t('You need to import this wallet via recovery phrase to send assets.')
            }
            confirmText={t('Dismiss')}
            icon={
              <EyeIcon
                color={theme.colors.textSecondary}
                height={theme.iconSizes.icon24}
                width={theme.iconSizes.icon24}
              />
            }
            modalName={ModalName.SwapWarning}
            severity={WarningSeverity.Low}
            title={t('This wallet is view-only')}
            onClose={(): void => setShowViewOnlyModal(false)}
            onConfirm={(): void => setShowViewOnlyModal(false)}
          />
        )}

        {showTokenSelector ? tokenSelector : null}
        {showRecipientSelector && recipientSelector ? recipientSelector : null}
      </AnimatedFlex>
    </TouchableWithoutFeedback>
  )
}

function InnerContentRouter(props: InnerContentProps): JSX.Element {
  const { derivedInfo, setStep } = props
  const onFormNext = useCallback(() => setStep(TransactionStep.REVIEW), [setStep])
  const onReviewNext = useCallback(() => setStep(TransactionStep.SUBMITTED), [setStep])
  const onReviewPrev = useCallback(() => setStep(TransactionStep.FORM), [setStep])
  const onRetrySubmit = useCallback(() => setStep(TransactionStep.FORM), [setStep])

  const isSwap = isSwapInfo(derivedInfo)
  if (isSwap)
    return (
      <SwapInnerContent
        derivedSwapInfo={derivedInfo}
        onFormNext={onFormNext}
        onRetrySubmit={onRetrySubmit}
        onReviewNext={onReviewNext}
        onReviewPrev={onReviewPrev}
        {...props}
      />
    )
  return (
    <TransferInnerContent
      derivedTransferInfo={derivedInfo}
      onFormNext={onFormNext}
      onRetrySubmit={onRetrySubmit}
      onReviewNext={onReviewNext}
      onReviewPrev={onReviewPrev}
      {...props}
    />
  )
}

interface SwapInnerContentProps extends InnerContentProps {
  derivedSwapInfo: DerivedSwapInfo
  onFormNext: () => void
  onReviewNext: () => void
  onReviewPrev: () => void
  onRetrySubmit: () => void
}

function SwapInnerContent({
  derivedSwapInfo,
  onClose,
  dispatch,
  totalGasFee,
  gasFallbackUsed,
  approveTxRequest,
  txRequest,
  warnings,
  onFormNext,
  onReviewNext,
  onReviewPrev,
  onRetrySubmit,
  step,
  exactValue,
  showingSelectorScreen,
}: SwapInnerContentProps): JSX.Element | null {
  switch (step) {
    case TransactionStep.SUBMITTED:
      return (
        <Trace logImpression section={SectionName.SwapPending}>
          <SwapStatus
            derivedSwapInfo={derivedSwapInfo}
            onNext={onClose}
            onTryAgain={onRetrySubmit}
          />
        </Trace>
      )

    case TransactionStep.FORM:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapForm
            derivedSwapInfo={derivedSwapInfo}
            dispatch={dispatch}
            exactValue={exactValue}
            showingSelectorScreen={showingSelectorScreen}
            warnings={warnings}
            onNext={onFormNext}
          />
        </Trace>
      )
    case TransactionStep.REVIEW:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReview
            approveTxRequest={approveTxRequest}
            derivedSwapInfo={derivedSwapInfo}
            exactValue={exactValue}
            gasFallbackUsed={gasFallbackUsed}
            totalGasFee={totalGasFee}
            txRequest={txRequest}
            warnings={warnings}
            onNext={onReviewNext}
            onPrev={onReviewPrev}
          />
        </Trace>
      )
    default:
      return null
  }
}

interface TransferInnerContentProps extends InnerContentProps {
  derivedTransferInfo: DerivedTransferInfo
  onFormNext: () => void
  onReviewNext: () => void
  onReviewPrev: () => void
  onRetrySubmit: () => void
}

function TransferInnerContent({
  showingSelectorScreen,
  derivedTransferInfo,
  onClose,
  dispatch,
  step,
  totalGasFee,
  txRequest,
  warnings,
  onFormNext,
  onRetrySubmit,
  onReviewNext,
  onReviewPrev,
}: TransferInnerContentProps): JSX.Element | null {
  switch (step) {
    case TransactionStep.SUBMITTED:
      return (
        <Trace logImpression section={SectionName.TransferPending}>
          <TransferStatus
            derivedTransferInfo={derivedTransferInfo}
            onNext={onClose}
            onTryAgain={onRetrySubmit}
          />
        </Trace>
      )
    case TransactionStep.FORM:
      return (
        <Trace logImpression section={SectionName.TransferForm}>
          <TransferTokenForm
            derivedTransferInfo={derivedTransferInfo}
            dispatch={dispatch}
            showingSelectorScreen={showingSelectorScreen}
            warnings={warnings}
            onNext={onFormNext}
          />
        </Trace>
      )
    case TransactionStep.REVIEW:
      return (
        <Trace logImpression section={SectionName.TransferReview}>
          <TransferReview
            derivedTransferInfo={derivedTransferInfo}
            totalGasFee={totalGasFee}
            txRequest={txRequest}
            warnings={warnings}
            onNext={onReviewNext}
            onPrev={onReviewPrev}
          />
        </Trace>
      )
    default:
      return null
  }
}
