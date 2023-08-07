import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import React, { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TextInput as NativeTextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { AnimatedButton, Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import PencilIcon from 'ui/src/assets/icons/pencil-detailed.svg'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.EditName>

export function EditNameScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // Reference pending accounts to avoid any lag in saga import.
  const pendingAccount = Object.values(usePendingAccounts())?.[0]

  // Sets the default wallet nickname based on derivation index once the pendingAccount is set.
  const defaultAccountName: string = useMemo(() => {
    if (!pendingAccount || pendingAccount.type === AccountType.Readonly) {
      return ''
    }

    const derivationIndex = pendingAccount.derivationIndex
    return pendingAccount.name || t('Wallet {{ number }}', { number: derivationIndex + 1 }) || ''
  }, [pendingAccount, t])

  const [newAccountName, setNewAccountName] = useState<string>(defaultAccountName)
  const [focused, setFocused] = useState(false)

  useAddBackButton(navigation)

  useEffect(() => {
    const beforeRemoveListener = (): void => {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)

    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation])

  const onPressNext = (): void => {
    navigation.navigate({
      name:
        params?.importType === ImportType.CreateNew
          ? OnboardingScreens.QRAnimation
          : OnboardingScreens.Notifications,
      merge: true,
      params,
    })

    if (pendingAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Rename,
          address: pendingAccount?.address,
          newName: newAccountName || pendingAccount.name,
        })
      )
    }
  }

  return (
    <OnboardingScreen
      subtitle={t('This is a way to keep track of your wallet. Only you will see this.')}
      title={t('Give your wallet a nickname')}>
      <Box my="spacing24">
        {pendingAccount ? (
          <CustomizationSection
            accountName={newAccountName || pendingAccount.name || ''}
            address={pendingAccount?.address}
            focused={focused}
            setAccountName={setNewAccountName}
            setFocused={setFocused}
          />
        ) : (
          <ActivityIndicator />
        )}
      </Box>
      <Flex justifyContent="flex-end">
        <Trace logPress element={ElementName.Continue}>
          <Button label={t('Create Wallet')} onPress={onPressNext} />
        </Trace>
      </Flex>
    </OnboardingScreen>
  )
}

function CustomizationSection({
  address,
  accountName,
  setAccountName,
  focused,
  setFocused,
}: {
  address: Address
  accountName: string
  setAccountName: Dispatch<SetStateAction<string>>
  focused: boolean
  setFocused: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const textInputRef = useRef<NativeTextInput>(null)

  const focusInputWithKeyboard = (): void => {
    textInputRef.current?.focus()
  }

  const gapSize = useResponsiveProp({
    xs: 'none',
    sm: 'spacing24',
  })

  const inputSize = useResponsiveProp({
    xs: theme.textVariants.headlineSmall.fontSize,
    sm: theme.textVariants.headlineMedium.fontSize,
  })

  return (
    <Flex centered gap={gapSize}>
      <Flex centered gap="spacing24" width="100%">
        <Flex centered row gap="none">
          <TextInput
            ref={textInputRef}
            autoFocus
            backgroundColor="none"
            fontSize={inputSize}
            maxFontSizeMultiplier={theme.textVariants.headlineMedium.maxFontSizeMultiplier}
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder="Nickname"
            placeholderTextColor={theme.colors.textTertiary}
            testID="customize/name"
            textAlign="center"
            value={accountName}
            onBlur={(): void => setFocused(false)}
            onChangeText={(newName): void => setAccountName(newName)}
            onFocus={(): void => setFocused(true)}
          />
          {!focused && (
            <AnimatedButton
              IconName={PencilIcon}
              emphasis={ButtonEmphasis.Secondary}
              entering={FadeIn}
              exiting={FadeOut}
              size={ButtonSize.Small}
              onPress={focusInputWithKeyboard}
            />
          )}
        </Flex>
        <Flex centered gap="spacing4">
          <Text color="textTertiary" variant="bodyMicro">
            {t('Your public address will be')}
          </Text>
          <Text color="textTertiary" variant="buttonLabelSmall">
            {shortenAddress(address)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
