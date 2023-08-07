import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface RecipientInputPanelProps {
  recipientAddress: string
  onToggleShowRecipientSelector: () => void
}

/**
 * Panel displaying currently selected recipient metadata as well as a toggle
 * to open the recipient selector modal.
 */
export function RecipientInputPanel({
  recipientAddress,
  onToggleShowRecipientSelector,
}: RecipientInputPanelProps): JSX.Element {
  const theme = useAppTheme()

  return (
    <TouchableArea
      p="spacing16"
      testID={ElementName.SelectRecipient}
      onPress={onToggleShowRecipientSelector}>
      <Flex gap="spacing8">
        <Flex centered row gap="spacing4">
          <AddressDisplay
            hideAddressInSubtitle
            address={recipientAddress}
            variant="headlineSmall"
          />
          <Chevron color={theme.colors.textPrimary} direction="e" />
        </Flex>

        {recipientAddress && <RecipientPrevTransfers recipient={recipientAddress} />}
      </Flex>
    </TouchableArea>
  )
}

export function RecipientPrevTransfers({ recipient }: { recipient: string }): JSX.Element {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const previousTransactions = useAllTransactionsBetweenAddresses(activeAddress, recipient)
  const prevTxnsCount = previousTransactions?.length ?? 0

  return (
    <Text color="textTertiary" textAlign="center" variant="subheadSmall">
      {prevTxnsCount === 1
        ? t('{{ prevTxnsCount }} previous transfer', { prevTxnsCount })
        : t('{{ prevTxnsCount }} previous transfers', { prevTxnsCount })}
    </Text>
  )
}
