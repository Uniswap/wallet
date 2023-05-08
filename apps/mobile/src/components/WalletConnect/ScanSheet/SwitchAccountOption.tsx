import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { Account } from 'src/features/wallet/accounts/types'
import { useDisplayName } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

type Props = {
  account: Account
  activeAccount: Account | null
}

const ICON_SIZE = 24

export const SwitchAccountOption = ({ account, activeAccount }: Props): JSX.Element => {
  const theme = useAppTheme()

  const displayName = useDisplayName(account.address)
  return (
    <>
      <Separator />
      <Flex row alignItems="center" justifyContent="space-between" px="spacing24" py="spacing8">
        <Unicon address={account.address} size={ICON_SIZE} />
        <Flex shrink alignItems="center" gap="none" p="none">
          <Text
            color="textPrimary"
            numberOfLines={1}
            testID={`address-display/name/${displayName?.name}`}
            variant="bodyLarge">
            {displayName?.name}
          </Text>
          <Text color="textSecondary" variant="subheadSmall">
            {shortenAddress(account.address)}
          </Text>
        </Flex>
        <Box height={ICON_SIZE} width={ICON_SIZE}>
          {activeAccount?.address === account.address && (
            <Check color={theme.colors.accentAction} height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </Box>
      </Flex>
    </>
  )
}
