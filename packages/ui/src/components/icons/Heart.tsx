import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M22.7927 11.1242C21.359 18.5187 12.0003 22.7782 12.0003 22.7782C12.0003 22.7782 2.64153 18.5187 1.20661 11.1242C0.326598 6.58719 2.24925 2.02329 7.13701 2.00007C10.7781 1.98296 12.0003 5.65211 12.0003 5.65211C12.0003 5.65211 13.2226 1.98173 16.8624 2.00007C21.7612 2.02329 23.6727 6.58841 22.7927 11.1242Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Heart'

export const Heart = memo<IconProps>(Icon)
