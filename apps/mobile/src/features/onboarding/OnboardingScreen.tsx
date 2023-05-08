import { useHeaderHeight } from '@react-navigation/elements'
import { useResponsiveProp } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  paddingTop?: keyof Theme['spacing']
  childrenGap?: keyof Theme['spacing']
  keyboardAvoidingViewEnabled?: boolean
}

export function OnboardingScreen({
  title,
  subtitle,
  children,
  paddingTop = 'none',
  keyboardAvoidingViewEnabled = true,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()

  const subtitleMaxFontScaleMultiplier = useResponsiveProp({
    xs: 1.1,
    sm: theme.textVariants.bodySmall.maxFontSizeMultiplier,
  })

  const titleSize = useResponsiveProp({
    xs: 'subheadLarge',
    sm: 'headlineSmall',
  })

  const subtitleSize = useResponsiveProp({
    xs: 'bodyMicro',
    sm: 'bodySmall',
  })

  const gapSize = useResponsiveProp({
    xs: 'none',
    sm: 'spacing16',
  })

  const responsiveHeaderHeight = useResponsiveProp({
    xs: headerHeight * 0.88,
    sm: headerHeight,
  })

  return (
    <Screen edges={['right', 'left']} style={{ paddingTop: responsiveHeaderHeight }}>
      <KeyboardAvoidingView
        behavior="padding"
        enabled={keyboardAvoidingViewEnabled}
        style={[WrapperStyle.base, { marginBottom: insets.bottom }]}>
        <AnimatedFlex
          grow
          entering={FadeIn}
          exiting={FadeOut}
          gap={gapSize}
          pb="spacing16"
          px="spacing16">
          {/* Text content */}
          <Flex centered gap="spacing12" m="spacing12">
            {title && (
              <Text
                allowFontScaling={false}
                paddingTop={paddingTop}
                textAlign="center"
                variant={titleSize}>
                {title}
              </Text>
            )}
            {subtitle ? (
              <Text
                color="textSecondary"
                maxFontSizeMultiplier={subtitleMaxFontScaleMultiplier}
                textAlign="center"
                variant={subtitleSize}>
                {subtitle}
              </Text>
            ) : null}
          </Flex>
          {/* page content */}
          <Flex fill grow justifyContent="space-between">
            {children}
          </Flex>
        </AnimatedFlex>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const WrapperStyle = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
