import { useResponsiveProp } from '@shopify/restyle'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { ElementName } from 'src/features/telemetry/constants'

export function OptionCard({
  title,
  blurb,
  icon,
  onPress,
  elementName,
  disabled,
  opacity,
  badgeText,
  hapticFeedback,
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
  elementName: ElementName
  disabled?: boolean
  opacity?: number
  badgeText?: string | undefined
  hapticFeedback?: boolean | undefined
}): JSX.Element {
  const theme = useAppTheme()

  const titleSize = useResponsiveProp({
    xs: 'subheadSmall',
    sm: 'bodyLarge',
  })

  const iconSize = useResponsiveProp({
    xs: theme.iconSizes.icon24,
    sm: theme.iconSizes.icon36,
  })

  const isDarkMode = useIsDarkMode()

  return (
    <Trace logPress element={elementName}>
      <TouchableArea
        backgroundColor="background1"
        borderColor={isDarkMode ? 'none' : 'backgroundScrim'}
        borderRadius="rounded20"
        borderWidth={1}
        disabled={disabled}
        hapticFeedback={hapticFeedback}
        opacity={disabled ? 0.5 : opacity}
        p="spacing16"
        testID={elementName}
        onPress={onPress}>
        <Flex row alignContent="center" alignItems="center" gap="spacing16">
          <Box
            alignItems="center"
            backgroundColor="magentaDark"
            borderRadius="roundedFull"
            height={iconSize}
            justifyContent="center"
            padding="spacing16"
            width={iconSize}>
            {icon}
          </Box>
          <Flex row alignItems="center" gap="spacing4" paddingRight="spacing60">
            <Flex fill alignItems="flex-start" gap="spacing4" justifyContent="space-around">
              <Flex row gap="spacing8">
                <Text allowFontScaling={false} variant={titleSize}>
                  {title}
                </Text>
                {badgeText && (
                  <Flex
                    centered
                    backgroundColor="magentaDark"
                    borderRadius="rounded8"
                    px="spacing8">
                    <Text color="magentaVibrant" variant="buttonLabelMicro">
                      {badgeText}
                    </Text>
                  </Flex>
                )}
              </Flex>
              <Text allowFontScaling={false} color="textSecondary" variant="bodySmall">
                {blurb}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
