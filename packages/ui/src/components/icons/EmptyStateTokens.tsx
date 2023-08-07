import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Rect, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = isWeb ? 'currentColor' : undefined,
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      sizeProp,
      'size'
    ) ?? sizeProp

  const strokeWidth =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      strokeWidthProp,
      'size'
    ) ?? strokeWidthProp

  const color =
    // @ts-expect-error its fine to access colorProp undefined
    theme[colorProp]?.get() ?? colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 66 65" width={size} {...svgProps}>
      <Rect
        fill={color}
        height="36.073"
        rx="2.327"
        transform="rotate(90 35.573 22.926)"
        width="8.463"
        x="35.573"
        y="22.926"
      />
      <Rect
        fill={color}
        height="36.073"
        rx="2.327"
        transform="rotate(90 35.573 11.463)"
        width="8.463"
        x="35.573"
        y="11.463"
      />
      <Rect
        fill={color}
        height="36.073"
        rx="2.327"
        transform="rotate(90 40.227 0)"
        width="8.463"
        x="40.227"
      />
      <Rect
        fill={color}
        height="36.073"
        rx="2.327"
        transform="rotate(90 39.064 34.389)"
        width="8.463"
        x="39.064"
        y="34.389"
      />
      <Rect
        fill={color}
        height="36.073"
        rx="2.327"
        transform="rotate(90 35.573 45.851)"
        width="8.463"
        x="35.573"
        y="45.851"
      />
    </Svg>
  )
})

Icon.displayName = 'EmptyStateTokens'

export const EmptyStateTokens = memo<IconProps>(Icon)
