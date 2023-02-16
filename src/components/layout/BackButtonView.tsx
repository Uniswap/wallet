import { useTheme } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type Props = {
  size?: number
  color?: keyof Theme['colors']
  showButtonLabel?: boolean
}

export function BackButtonView({ size, color, showButtonLabel }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  return (
    <Flex row alignItems="center" gap="spacing8">
      <Chevron
        color={color ? theme.colors[color] : theme.colors.textSecondary}
        height={size}
        width={size}
      />
      {showButtonLabel && (
        <Text color="textSecondary" variant="subheadLarge">
          {t('Back')}
        </Text>
      )}
    </Flex>
  )
}
