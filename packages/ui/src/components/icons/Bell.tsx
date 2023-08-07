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
        d="M14.167 20.252C13.711 21.033 12.903 21.5 12.005 21.5C11.107 21.5 10.298 21.033 9.84295 20.252C9.75295 20.097 9.75295 19.906 9.84195 19.751C9.93095 19.596 10.096 19.5 10.276 19.5H13.7359C13.9149 19.5 14.0799 19.596 14.1699 19.751C14.2599 19.906 14.257 20.098 14.167 20.252ZM20.3999 17.69C20.3799 17.66 18.5 15.28 18.5 12.5V9C18.5 8.864 18.495 8.731 18.487 8.598C18.478 8.458 18.3839 8.384 18.3439 8.356C18.3079 8.331 18.2129 8.28399 18.0899 8.32499C17.7559 8.43699 17.3979 8.49699 17.0249 8.49899C15.3239 8.51099 13.793 7.23 13.541 5.548C13.414 4.696 13.5869 3.89 13.9909 3.222C14.0949 3.05 14.0299 2.82099 13.8379 2.76499C12.8019 2.45999 11.6489 2.40099 10.4739 2.67999C7.51195 3.38399 5.50995 6.169 5.50995 9.214V12.5C5.50995 15.28 3.62995 17.66 3.60995 17.69C3.48995 17.84 3.46995 18.04 3.54995 18.22C3.63995 18.39 3.80995 18.5 3.99995 18.5H20C20.2 18.5 20.37 18.39 20.46 18.22C20.54 18.04 20.5199 17.84 20.3999 17.69ZM17 3C15.895 3 15 3.895 15 5C15 6.105 15.895 7 17 7C18.105 7 19 6.105 19 5C19 3.895 18.105 3 17 3Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Bell'

export const Bell = memo<IconProps>(Icon)
