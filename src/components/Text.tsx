import { createText, useResponsiveProp } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { Box } from 'src/components/layout'
import { Shimmer } from 'src/components/loading/Shimmer'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { textVariants } from 'src/styles/font'
import { Theme } from 'src/styles/theme'

export const DEFAULT_FONT_SCALE = 1

export type TextProps = ComponentProps<typeof ThemedText> & {
  maxFontSizeMultiplier?: number
  animated?: boolean
  allowFontScaling?: boolean
  loading?: boolean | 'no-shimmer'
  loadingPlaceholderText?: string
}

// Use this text component throughout the app instead of
// Default RN Text for theme support
const ThemedText = createText<Theme>()
const ThemedAnimatedText = createText<Theme>(Animated.Text)

const TextPlaceholder = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
  return (
    <Box alignItems="center" flexDirection="row">
      <Box alignItems="center" flexDirection="row" position="relative">
        <HiddenFromScreenReaders>{children}</HiddenFromScreenReaders>
        <Box
          bg="background3"
          borderRadius="rounded4"
          bottom="5%"
          left={0}
          position="absolute"
          right={0}
          top="5%"
        />
      </Box>
    </Box>
  )
}

const TextLoaderWrapper = ({
  children,
  loadingShimmer,
}: { loadingShimmer?: boolean } & PropsWithChildren<unknown>): JSX.Element => {
  const inner = <TextPlaceholder>{children}</TextPlaceholder>
  if (loadingShimmer) {
    return <Shimmer>{inner}</Shimmer>
  }

  return inner
}

/**
 * Use this component instead of the default React Native <Text> component anywhere text shows up throughout the app, so we can use the design system values for colors and sizes, and make sure all text looks and behaves the same way
 * @param loading Whether the text inside the component is still loading or not. Set this to true if whatever content goes inside the <Text> component is coming from a variable that might still be loading. This prop is optional and defaults to false. This prop can also be set to "no-shimmer" to enable a loading state without the shimmer effect.
 * @param loadingPlaceholderText - The text that the loader's size will be derived from. Pick something that's close to the same length as the final text is expected to be, e.g. if it's a ticker symbol, "XXX" might be a good placeholder text. This prop is optional and defaults to "$00.00".
 */
export const Text = ({
  animated,
  loading = false,
  maxFontSizeMultiplier,
  allowFontScaling,
  loadingPlaceholderText = '$00.00',
  ...rest
}: TextProps): JSX.Element => {
  const { fontScale } = useWindowDimensions()
  const variant = useResponsiveProp(rest.variant ?? 'bodySmall') as keyof typeof textVariants
  const enableFontScaling = allowFontScaling ?? fontScale > DEFAULT_FONT_SCALE
  const multiplier = maxFontSizeMultiplier ?? textVariants[variant].maxFontSizeMultiplier

  if (animated) {
    return (
      <ThemedAnimatedText
        allowFontScaling={enableFontScaling}
        maxFontSizeMultiplier={multiplier}
        {...rest}
      />
    )
  }

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <ThemedText
          allowFontScaling={enableFontScaling}
          color="none"
          maxFontSizeMultiplier={multiplier}
          opacity={0}
          {...rest}>
          {/* Important that `children` isn't used or rendered by <Text> when `loading` is true, because if the child of a <Text> component is a dynamic variable that might not be finished fetching yet, it'll result in an error until it's finished loading. We use `loadingPlaceholderText` to set the size of the loading element instead. */}
          {loadingPlaceholderText}
        </ThemedText>
      </TextLoaderWrapper>
    )
  }

  return (
    <ThemedText allowFontScaling={enableFontScaling} maxFontSizeMultiplier={multiplier} {...rest} />
  )
}
