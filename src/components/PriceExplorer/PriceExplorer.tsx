import { ImpactFeedbackStyle } from 'expo-haptics'
import React from 'react'
import { SharedValue } from 'react-native-reanimated'
import { LineChart, LineChartProvider } from 'react-native-wagmi-charts'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Loader } from 'src/components/loading'
import {
  CHART_HEIGHT,
  CURSOR_INNER_SIZE,
  CURSOR_SIZE,
} from 'src/components/PriceExplorer/constants'
import { PriceExplorerError } from 'src/components/PriceExplorer/PriceExplorerError'
import { DatetimeText, PriceText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { TimeRangeGroup } from 'src/components/PriceExplorer/TimeRangeGroup'
import { CurrencyId } from 'src/utils/currencyId'
import { invokeImpact } from 'src/utils/haptic'
import { useTokenPriceHistory } from './usePriceHistory'

type PriceTextProps = {
  loading: boolean
  relativeChange?: SharedValue<number>
}

function PriceTextSection({ loading, relativeChange }: PriceTextProps): JSX.Element {
  return (
    <Box mx="spacing12">
      <PriceText loading={loading} />
      <Flex row gap="spacing4">
        <RelativeChangeText loading={loading} spotRelativeChange={relativeChange} />
        <DatetimeText loading={loading} />
      </Flex>
    </Box>
  )
}

export type LineChartPriceAndDateTimeTextProps = {
  currencyId: CurrencyId
}

export function PriceExplorer({
  currencyId,
  tokenColor,
  onRetry,
}: {
  currencyId: string
  tokenColor?: string
  onRetry: () => void
}): JSX.Element {
  const { data, loading, error, refetch, setDuration } = useTokenPriceHistory(currencyId)

  if (!loading && !data) {
    // Propagate retry up while refetching, if available
    const refetchAndRetry = (): void => {
      if (refetch) refetch()
      onRetry()
    }
    return <PriceExplorerError showRetry={error !== undefined} onRetry={refetchAndRetry} />
  }

  return (
    <Box overflow="hidden">
      {data?.priceHistory ? (
        <LineChartProvider
          data={data.priceHistory}
          onCurrentIndexChange={invokeImpact[ImpactFeedbackStyle.Light]}>
          <Flex gap="spacing8">
            <PriceTextSection loading={loading} relativeChange={data.spot?.relativeChange} />
            <Box my="spacing24">
              <LineChart height={CHART_HEIGHT}>
                <LineChart.Path color={tokenColor} />

                <LineChart.CursorLine color={tokenColor} />
                <LineChart.CursorCrosshair
                  color={tokenColor}
                  outerSize={CURSOR_SIZE}
                  size={CURSOR_INNER_SIZE}
                  onActivated={invokeImpact[ImpactFeedbackStyle.Light]}
                  onEnded={invokeImpact[ImpactFeedbackStyle.Light]}
                />
              </LineChart>
            </Box>
          </Flex>
        </LineChartProvider>
      ) : (
        <Flex gap="spacing8">
          <PriceTextSection loading={loading} />
          <Box my="spacing24">
            <Loader.Graph />
          </Box>
        </Flex>
      )}

      <TimeRangeGroup setDuration={setDuration} />
    </Box>
  )
}
