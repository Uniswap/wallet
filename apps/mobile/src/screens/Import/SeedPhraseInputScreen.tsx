import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { RECOVERY_PHRASE_HELP_URL } from 'src/constants/urls'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import {
  MnemonicValidationError,
  translateMnemonicErrorMessage,
  userFinishedTypingWord,
  validateMnemonic,
  validateSetOfWords,
} from 'wallet/src/utils/mnemonics'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function SeedPhraseInputScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  /**
   * If paste permission modal is open, we need to manually disable the splash screen that appears on blur,
   * since the modal triggers the same `inactive` app state as does going to app switcher
   *
   * Technically seed phrase will be blocked if user pastes from keyboard,
   * but that is an extreme edge case.
   **/
  const [pastePermissionModalOpen, setPastePermissionModalOpen] = useState(false)
  useLockScreenOnBlur(pastePermissionModalOpen)

  const [value, setValue] = useState<string | undefined>(undefined)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  useAddBackButton(navigation)

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(() => {
    // Check phrase validation
    const { validMnemonic, error, invalidWord } = validateMnemonic(value)

    if (error) {
      setErrorMessage(translateMnemonicErrorMessage(error, invalidWord, t))
      return
    }

    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        validatedMnemonic: validMnemonic,
        indexes: Array.from(Array(NUMBER_OF_WALLETS_TO_IMPORT).keys()),
      })
    )
    navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
  }, [value, t, dispatch, navigation, params])

  const onBlur = useCallback(() => {
    const { error, invalidWord } = validateMnemonic(value)
    if (error) {
      setShowSuccess(false)
      setErrorMessage(translateMnemonicErrorMessage(error, invalidWord, t))
    }
  }, [t, value])

  const onChange = (text: string | undefined): void => {
    const { error, invalidWord, isValidLength } = validateSetOfWords(text)

    // always show success UI if phrase is valid length
    if (isValidLength) {
      setShowSuccess(true)
    } else {
      setShowSuccess(false)
    }

    // suppress error messages if the  user is not done typing a word
    const suppressError =
      (error === MnemonicValidationError.InvalidWord && !userFinishedTypingWord(text)) ||
      error === MnemonicValidationError.NotEnoughWords

    if (!error || suppressError) {
      setErrorMessage(undefined)
    } else {
      setErrorMessage(translateMnemonicErrorMessage(error, invalidWord, t))
    }

    setValue(text)
  }

  const onPressRecoveryHelpButton = (): Promise<void> => openUri(RECOVERY_PHRASE_HELP_URL)

  const subtitleSize = useResponsiveProp({
    xs: 'bodyMicro',
    sm: 'subheadSmall',
  })

  const itemSpacing = useResponsiveProp({
    xs: 'none',
    sm: 'spacing8',
  })

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t('Your recovery phrase will only be stored locally on your device.')}
      title={t('Enter your recovery phrase')}>
      <Flex gap={itemSpacing}>
        <GenericImportForm
          autoCorrect
          blurOnSubmit
          liveCheck
          afterPasteButtonPress={(): void => setPastePermissionModalOpen(false)}
          beforePasteButtonPress={(): void => setPastePermissionModalOpen(true)}
          errorMessage={errorMessage}
          placeholderLabel={t('recovery phrase')}
          showSuccess={showSuccess}
          textAlign="center" // Fixes iOS text input issue where right align trims trailing whitespace
          value={value}
          onBlur={onBlur}
          onChange={onChange}
        />
        <Flex centered>
          <Trace logPress element={ElementName.RecoveryHelpButton}>
            <TouchableArea onPress={onPressRecoveryHelpButton}>
              <Text color="accentAction" variant={subtitleSize}>
                {t('How do I find my recovery phrase?')}
              </Text>
            </TouchableArea>
          </Trace>
        </Flex>
      </Flex>

      <Trace logPress element={ElementName.Next}>
        <Button disabled={!!errorMessage || !value} label={t('Continue')} onPress={onSubmit} />
      </Trace>
    </SafeKeyboardOnboardingScreen>
  )
}
