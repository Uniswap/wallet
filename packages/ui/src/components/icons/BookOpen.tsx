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
        d="M21 5.31992V18.3299C21 18.6599 20.6801 18.89 20.3501 18.8C17.9661 18.121 15.573 18.118 13.187 19.308C12.986 19.408 12.749 19.272 12.749 19.047V5.853C12.749 5.786 12.7701 5.71901 12.8091 5.66501C13.4321 4.81001 14.396 4.21495 15.519 4.07895C17.331 3.85895 19.0731 4.07903 20.7141 4.86203C20.8891 4.94503 21 5.12692 21 5.31992ZM8.47998 4.07993C6.66798 3.85993 4.92591 4.08001 3.28491 4.86301C3.11091 4.94601 3 5.12802 3 5.32102V18.331C3 18.661 3.3199 18.891 3.6499 18.801C6.0339 18.122 8.42699 18.1189 10.813 19.3089C11.014 19.4089 11.251 19.2729 11.251 19.0479V5.85398C11.251 5.78698 11.2299 5.71999 11.1909 5.66599C10.5669 4.81099 9.60398 4.21593 8.47998 4.07993Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'BookOpen'

export const BookOpen = memo<IconProps>(Icon)
