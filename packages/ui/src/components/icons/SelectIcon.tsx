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
        d="M7 10C5.343 10 4 8.657 4 7C4 5.343 5.343 4 7 4C8.657 4 10 5.343 10 7C10 8.657 8.657 10 7 10ZM20 7C20 5.343 18.657 4 17 4C15.343 4 14 5.343 14 7C14 8.657 15.343 10 17 10C18.657 10 20 8.657 20 7ZM10 17C10 15.343 8.657 14 7 14C5.343 14 4 15.343 4 17C4 18.657 5.343 20 7 20C8.657 20 10 18.657 10 17ZM20 17C20 15.343 18.657 14 17 14C15.343 14 14 15.343 14 17C14 18.657 15.343 20 17 20C18.657 20 20 18.657 20 17Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'SelectIcon'

export const SelectIcon = memo<IconProps>(Icon)
