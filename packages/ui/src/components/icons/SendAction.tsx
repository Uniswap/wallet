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
        d="M21.421 5.66912L18.1411 18.7892C17.6711 20.6592 16.071 21.4992 14.671 21.4992C14.661 21.4992 14.6511 21.4992 14.6511 21.4992C13.2411 21.4892 11.6311 20.6292 11.1911 18.7392L10.3311 15.0893L15.7111 9.70916C16.1011 9.31916 16.1011 8.67924 15.7111 8.28924C15.3211 7.89924 14.681 7.89924 14.291 8.28924L8.91104 13.6691L5.26107 12.8093C3.37107 12.3693 2.51106 10.7593 2.50106 9.35931C2.49106 7.94931 3.33109 6.32931 5.21109 5.85931L18.3311 2.57928C19.2011 2.35928 20.1111 2.6092 20.7511 3.2492C21.3911 3.8892 21.641 4.79912 21.421 5.66912Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'SendAction'

export const SendAction = memo<IconProps>(Icon)
