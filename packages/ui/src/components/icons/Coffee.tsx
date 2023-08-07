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
    <Svg
      ref={ref}
      fill="none"
      height={size}
      stroke={color}
      viewBox="0 0 20 19"
      width={size}
      {...svgProps}>
      <Path
        d="M15 6.7h.8a3.3 3.3 0 0 1 0 6.6H15"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M1.7 6.7H15v7.5a3.3 3.3 0 0 1-3.3 3.3H5a3.3 3.3 0 0 1-3.3-3.3V6.7Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M5 .8v2.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M8.3.8v2.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M11.7.8v2.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  )
})

Icon.displayName = 'Coffee'

export const Coffee = memo<IconProps>(Icon)
