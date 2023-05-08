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
import { Box } from 'src/components/layout'

const SHIMMER_DURATION = 2000 // 2 seconds

type Props = {
  children: JSX.Element
}
// inspired by tutorial found here: https://github.com/kadikraman/skeleton-loader
export function Shimmer({ children }: Props): JSX.Element {
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  useEffect(() => {
    // TODO: [MOB-3874] tweak animation to be smoother, right now sometimes looks kind of stuttery
    xPosition.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION }), Infinity, true)

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

  return (
    <MaskedView
      maskElement={children}
      style={{
        width: layout.width,
        height: layout.height,
      }}>
      <Box backgroundColor="background2" flexGrow={1} overflow="hidden" />
      <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <MaskedView
          maskElement={
            <LinearGradient
              colors={['transparent', 'black', 'black', 'black', 'transparent']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          }
          style={StyleSheet.absoluteFill}>
          <Box backgroundColor="backgroundOutline" style={StyleSheet.absoluteFill} />
        </MaskedView>
      </Reanimated.View>
    </MaskedView>
  )
}
