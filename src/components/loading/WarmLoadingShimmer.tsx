import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { LayoutRectangle, StyleSheet, View } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { opacify } from 'src/utils/colors'

const SHIMMER_DURATION = 2000 // 2 seconds

type WarmLoadingShimmerProps = {
  isWarmLoading?: boolean
  children: JSX.Element
}

// TODO(MOB-3553): bake this component's functionality into the Shimmer component
export function WarmLoadingShimmer({
  children,
  isWarmLoading = true,
}: WarmLoadingShimmerProps): JSX.Element {
  const theme = useAppTheme()

  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  useEffect(() => {
    xPosition.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION }), Infinity, false)

    // only want to do this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          xPosition.value,
          [0, 1],
          [layout ? -layout.width : 0, layout ? layout.width : 0]
        ),
      },
    ],
  }))

  if (!layout) {
    return <View onLayout={(event): void => setLayout(event.nativeEvent.layout)}>{children}</View>
  }

  if (isWarmLoading) {
    return (
      <MaskedView maskElement={children} style={{ width: layout.width, height: layout.height }}>
        <Box backgroundColor="textSecondary" flexGrow={1} height="100%" overflow="hidden" />
        <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[
              theme.colors.textSecondary,
              opacify(64, theme.colors.textPrimary),
              theme.colors.textSecondary,
            ]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      </MaskedView>
    )
  }

  return children
}
