import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { uniswapUrls } from 'src/constants/urls'
import { ElementName } from 'src/features/telemetry/constants'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { useTimeout } from 'src/utils/timing'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()

  // If we're replacing a seed phrase, skip to the seed phrase input screen.
  // We navigate from here so that the landing screen is still in the stack.
  useEffect(() => {
    if (params?.shouldSkipToSeedPhraseInput === true)
      navigation.navigate(OnboardingScreens.SeedPhraseInput)
  }, [navigation, params])

  const { t } = useTranslation()
  const isDarkMode = useColorScheme() === 'dark'

  const onPressGetStarted = (): void => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    navigation.navigate(OnboardingScreens.ImportMethod)
  }

  const outerGap = useResponsiveProp({ xs: 'spacing12', sm: 'spacing24' })
  const buttonSize = useResponsiveProp({ xs: ButtonSize.Medium, sm: ButtonSize.Large })
  const pb = useResponsiveProp({ xs: 'spacing12', sm: 'none' })

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(SplashScreen.hideAsync, 1)

  return (
    <Screen edges={['bottom']}>
      <Flex shrink height="100%" width="100%">
        <LandingBackground />
      </Flex>
      <Flex grow height="auto">
        <Flex gap={outerGap} justifyContent="flex-end">
          <Flex mx="spacing16">
            <Button
              label={t('Get started')}
              name={ElementName.GetStarted}
              size={buttonSize}
              onPress={onPressGetStarted}
            />
          </Flex>
          <Box mx="spacing24" pb={pb}>
            <Text color="textTertiary" mx="spacing4" textAlign="center" variant="buttonLabelMicro">
              <Trans t={t}>
                By continuing, I agree to the{' '}
                <Text
                  color={isDarkMode ? 'accentActive' : 'accentAction'}
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
                  Terms of Service
                </Text>{' '}
                and consent to the{' '}
                <Text
                  color={isDarkMode ? 'accentActive' : 'accentAction'}
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
                  Privacy Policy
                </Text>
                .
              </Trans>
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Screen>
  )
}
