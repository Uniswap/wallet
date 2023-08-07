import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24

export function NetworkOption({
  chainId,
  currentlySelected,
}: {
  chainId: ChainId | null
  currentlySelected?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const info = chainId && CHAIN_INFO[chainId]
  return (
    <>
      <Separator />
      <Flex row alignItems="center" justifyContent="space-between" px="spacing24" py="spacing16">
        {(chainId && <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />) || (
          <Box width={NETWORK_OPTION_ICON_SIZE} />
        )}
        <Text color="textPrimary" variant="bodyLarge">
          {info?.label ?? t('All networks')}
        </Text>
        <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
          {currentlySelected && (
            <Check
              color={theme.colors.textPrimary}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          )}
        </Flex>
      </Flex>
    </>
  )
}
