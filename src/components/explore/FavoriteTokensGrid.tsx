import { default as React, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard, {
  FAVORITE_TOKEN_CARD_LOADER_HEIGHT,
} from 'src/components/explore/FavoriteTokenCard'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }
const HALF_WIDTH = { width: '50%' }

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading }: { showLoading: boolean }): JSX.Element | null {
  const { t } = useTranslation()

  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const currencyIds = useMemo(() => Array.from(favoriteCurrencyIdsSet), [favoriteCurrencyIdsSet])

  // Reset edit mode when there are no favorite tokens
  useEffect(() => {
    if (favoriteCurrencyIdsSet.size === 0) {
      setIsEditing(false)
    }
  }, [favoriteCurrencyIdsSet.size])

  return (
    <AnimatedBox entering={FadeIn}>
      <FavoriteHeaderRow
        editingTitle={t('Edit favorite tokens')}
        isEditing={isEditing}
        title={t('Favorite tokens')}
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteTokensGridLoader />
      ) : (
        <Box flexDirection="row" flexWrap="wrap">
          {currencyIds.map((currencyId) => (
            <FavoriteTokenCard
              key={currencyId}
              currencyId={currencyId}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              style={HALF_WIDTH}
            />
          ))}
        </Box>
      )}
    </AnimatedBox>
  )
}

function FavoriteTokensGridLoader(): JSX.Element {
  return (
    <Flex row gap="spacing8">
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Box>
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Box>
    </Flex>
  )
}
