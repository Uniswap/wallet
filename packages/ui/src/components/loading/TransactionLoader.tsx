import { Text } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { iconSizes } from 'ui/src/theme/iconSizes'

interface TransactionLoaderProps {
  opacity: number
}

export const TXN_HISTORY_LOADER_ICON_SIZE = iconSizes.icon40

export function TransactionLoader({ opacity }: TransactionLoaderProps): JSX.Element {
  return (
    <Flex opacity={opacity} overflow="hidden" sentry-label="TransactionLoader">
      <Flex
        grow
        row
        alignItems="flex-start"
        gap="$spacing16"
        justifyContent="space-between"
        py="$spacing12">
        <Flex
          row
          shrink
          alignItems="center"
          gap="$spacing12"
          height="100%"
          justifyContent="flex-start">
          <Flex
            centered
            bg="$background3"
            borderRadius="$roundedFull"
            height={TXN_HISTORY_LOADER_ICON_SIZE}
            width={TXN_HISTORY_LOADER_ICON_SIZE}
          />
          <Flex shrink gap="$none">
            <Flex row alignItems="center" gap="$spacing4">
              <Text
                loading
                loadingPlaceholderText="Contract Interaction"
                numberOfLines={1}
                variant="bodyLarge"
              />
            </Flex>
            <Text
              loading
              color="$textSecondary"
              loadingPlaceholderText="Caption Text"
              numberOfLines={1}
              variant="subheadSmall"
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
