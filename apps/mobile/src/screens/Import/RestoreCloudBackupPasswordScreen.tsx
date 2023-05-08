import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { Flex } from 'src/components/layout/Flex'
import {
  incrementPasswordAttempts,
  resetLockoutEndTime,
  resetPasswordAttempts,
  setLockoutEndTime,
} from 'src/features/CloudBackup/passwordLockoutSlice'
import { restoreMnemonicFromICloud } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { selectLockoutEndTime, selectPasswordAttempts } from 'src/features/CloudBackup/selectors'
import { importAccountActions, IMPORT_WALLET_AMOUNT } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { ONE_HOUR_MS, ONE_MINUTE_MS } from 'src/utils/time'
import { useAddBackButton } from 'src/utils/useAddBackButton'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupPassword
>

/**
 * If the attempt count does not correspond to a lockout then returns undefined. Otherwise returns the lockout time based on attempts. The lockout time logic is as follows:
 * after 6 attempts, lock out for 5 minutes
 * after 10 attempts, lock out for 15 minutes
 * after 12 attempts and any subsequent multiple of 2, lock out for another 1hr
 */
function calculateLockoutEndTime(attemptCount: number): number | undefined {
  if (attemptCount < 6) {
    return undefined
  }
  if (attemptCount === 6) {
    return Date.now() + ONE_MINUTE_MS * 5
  }
  if (attemptCount < 10) {
    return undefined
  }
  if (attemptCount === 10) {
    return Date.now() + ONE_MINUTE_MS * 15
  }
  if (attemptCount < 12) {
    return undefined
  }
  if (attemptCount % 2 === 0) {
    return Date.now() + ONE_HOUR_MS
  }
  return undefined
}

function getLockoutTimeMessage(remainingLockoutTime: number): string {
  const minutes = Math.ceil(remainingLockoutTime / ONE_MINUTE_MS)
  if (minutes >= 60) {
    return '1 hour'
  }

  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

export function RestoreCloudBackupPasswordScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const dispatch = useAppDispatch()

  const passwordAttemptCount = useAppSelector(selectPasswordAttempts)
  const lockoutEndTime = useAppSelector(selectLockoutEndTime)

  const [enteredPassword, setEnteredPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const remainingLockoutTime = lockoutEndTime ? Math.max(0, lockoutEndTime - Date.now()) : 0
  const isLockedOut = remainingLockoutTime > 0

  useFocusEffect(
    useCallback(() => {
      if (isLockedOut) {
        setErrorMessage(
          t('Too many attempts. Try again in {{time}}.', {
            time: getLockoutTimeMessage(remainingLockoutTime),
          })
        )

        const timer = setTimeout(() => {
          setErrorMessage(undefined)
          dispatch(resetLockoutEndTime())
          inputRef.current?.focus()
        }, remainingLockoutTime)

        return () => clearTimeout(timer)
      }
    }, [isLockedOut, t, dispatch, remainingLockoutTime])
  )

  useAddBackButton(navigation)

  const onPasswordSubmit = (): void => {
    if (isLockedOut || enteredPassword.length === 0) return

    // Atttempt to restore backup with encrypted mnemonic using password
    async function checkCorrectPassword(): Promise<void> {
      try {
        await restoreMnemonicFromICloud(params.mnemonicId, enteredPassword)
        dispatch(
          importAccountActions.trigger({
            type: ImportAccountType.RestoreBackup,
            mnemonicId: params.mnemonicId,
            indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
          })
        )
        dispatch(resetPasswordAttempts())
        navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
      } catch (error) {
        dispatch(incrementPasswordAttempts())
        const updatedLockoutEndTime = calculateLockoutEndTime(passwordAttemptCount + 1)
        if (updatedLockoutEndTime) {
          dispatch(setLockoutEndTime({ lockoutEndTime: updatedLockoutEndTime }))
        } else {
          setErrorMessage(t('Invalid password. Please try again.'))
          inputRef.current?.focus()
        }
      }
    }

    checkCorrectPassword()
    setEnteredPassword('')
    Keyboard.dismiss()
  }

  const onContinuePress = (): void => {
    onPasswordSubmit()
  }

  return (
    <OnboardingScreen
      subtitle={t('This password is required to recover your recovery phrase backup from iCloud.')}
      title={t('Enter your iCloud backup password')}>
      <Flex>
        <PasswordInput
          ref={inputRef}
          autoFocus={!isLockedOut}
          editable={!isLockedOut}
          placeholder={t('Enter password')}
          value={enteredPassword}
          onChangeText={(newValue: string): void => {
            if (!isLockedOut) {
              setErrorMessage(undefined)
            }
            setEnteredPassword(newValue)
          }}
          onSubmitEditing={onPasswordSubmit}
        />
        {errorMessage && <PasswordError errorText={errorMessage} />}
      </Flex>
      <Button
        disabled={!enteredPassword || isLockedOut}
        label={t('Continue')}
        name={ElementName.Submit}
        onPress={onContinuePress}
      />
    </OnboardingScreen>
  )
}
