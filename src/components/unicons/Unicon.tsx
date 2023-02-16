import {
  BlurMask,
  Canvas,
  Circle,
  Color,
  Group,
  LinearGradient,
  Mask,
  Path,
  Rect,
  vec,
} from '@shopify/react-native-skia'
import React, { memo, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import 'react-native-reanimated'
import { Box } from 'src/components/layout'
import {
  blurs,
  UniconAttributeData,
  UniconAttributes,
  UniconAttributesToIndices,
} from 'src/components/unicons/types'
import {
  deriveUniconAttributeIndices,
  getUniconAttributeData,
  isEthAddress,
} from 'src/components/unicons/utils'
import { flex } from 'src/styles/flex'

// HACK: Add 1 to effectively increase margin between svg and surrounding box, otherwise get a cropping issue
const ORIGINAL_SVG_SIZE = 36 + 1
const EMBLEM_XY_SHIFT = 10

const GradientBlur = ({
  size,
  gradientStart,
  gradientEnd,
  blurColor,
}: {
  size: number
  gradientStart: Color
  gradientEnd: Color
  blurColor: Color
}): JSX.Element => {
  return (
    <Group transform={[{ scale: size / ORIGINAL_SVG_SIZE }]}>
      <Rect height={ORIGINAL_SVG_SIZE} width={ORIGINAL_SVG_SIZE} x={0} y={0}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          end={vec(ORIGINAL_SVG_SIZE, ORIGINAL_SVG_SIZE / 2)}
          start={vec(0, ORIGINAL_SVG_SIZE / 2)}
        />
      </Rect>
      <Circle
        color={blurColor}
        cx={ORIGINAL_SVG_SIZE / 2}
        cy={(-13 / 36) * ORIGINAL_SVG_SIZE}
        r={(30 / 36) * ORIGINAL_SVG_SIZE}>
        <BlurMask blur={15} />
      </Circle>
    </Group>
  )
}

function UniconMask({
  size,
  attributeData,
  overlay = false,
}: {
  size: number
  attributeData: UniconAttributeData
  overlay?: boolean
}): JSX.Element {
  return (
    <Group
      blendMode={overlay ? 'multiply' : 'xor'}
      transform={[{ scale: size / ORIGINAL_SVG_SIZE }]}>
      <Group transform={[{ translateX: EMBLEM_XY_SHIFT }, { translateY: EMBLEM_XY_SHIFT }]}>
        {/* This is the shape generation code */}
        {attributeData[UniconAttributes.Shape].map((pathProps) => (
          <Path key={pathProps.path as string} {...pathProps} />
        ))}
      </Group>
      {/* This is the container generation code */}
      {attributeData[UniconAttributes.Container].map((pathProps) => (
        <Path key={pathProps.path as string} {...pathProps} />
      ))}
    </Group>
  )
}

function UniconSvg({
  attributeIndices,
  size,
  lightModeOverlay,
}: {
  attributeIndices: UniconAttributesToIndices
  size: number
  lightModeOverlay?: boolean
}): JSX.Element | null {
  // UniconSvg is used in the Unicon component or for testing specific shapes/containers
  // UniconSvg canvases will grow to fit their container
  // For best results, wrap in a Box with width and height set to size
  // const [attributeData, setAttributeData] = useState<UniconAttributeData>()

  const attributeData = useMemo(() => getUniconAttributeData(attributeIndices), [attributeIndices])

  if (!attributeIndices || !attributeData) return null

  const blurColor = blurs[attributeIndices[UniconAttributes.GradientStart]]
  if (!blurColor) return null

  return (
    <Canvas style={flex.fill}>
      <Mask clip={true} mask={<UniconMask attributeData={attributeData} size={size} />}>
        <GradientBlur
          blurColor={blurColor}
          gradientEnd={attributeData[UniconAttributes.GradientEnd]}
          gradientStart={attributeData[UniconAttributes.GradientStart]}
          size={size}
        />
      </Mask>
      {lightModeOverlay && (
        <Mask clip={true} mask={<UniconMask overlay attributeData={attributeData} size={size} />}>
          <Rect
            color="#000000"
            height={ORIGINAL_SVG_SIZE}
            opacity={0.08}
            width={ORIGINAL_SVG_SIZE}
            x={0}
            y={0}
          />
        </Mask>
      )}
    </Canvas>
  )
}

interface Props {
  address: string
  size: number
  randomSeed?: number
  border?: boolean
}

export const Unicon = memo(_Unicon)

export function _Unicon({ address, size, randomSeed = 0 }: Props): JSX.Element | null {
  // TODO(MOB-2992): move this into a mandatory boolean prop for the Unicon component (e.g. `lightModeOverlay`) so that any consumer of the Unicon component has to decide whether or not to show the light mode overlay (presumably based on whether the current theme is light or dark)
  const isLightMode = useColorScheme() === 'light'

  // Renders a Unicon inside a (size) x (size) pixel square Box
  const attributeIndices = useMemo(
    () => deriveUniconAttributeIndices(address, randomSeed),
    [address, randomSeed]
  )

  if (!address || !isEthAddress(address) || !attributeIndices) return null

  return (
    <Box height={size} width={size}>
      <UniconSvg attributeIndices={attributeIndices} lightModeOverlay={isLightMode} size={size} />
    </Box>
  )
}
