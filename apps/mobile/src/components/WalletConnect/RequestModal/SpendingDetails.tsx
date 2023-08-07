import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { ChainId } from 'wallet/src/constants/chains'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useNativeCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { formatCurrencyAmount, formatUSDPrice, NumberType } from 'wallet/src/utils/format'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function SpendingDetails({
  value,
  chainId,
}: {
  value: string
  chainId: ChainId
}): JSX.Element {
  const { t } = useTranslation()

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const nativeCurrencyAmount = nativeCurrencyInfo
    ? getCurrencyAmount({
        value,
        valueType: ValueType.Raw,
        currency: nativeCurrencyInfo.currency,
      })
    : null
  const usdValue = useUSDValue(chainId, value)

  return (
    <Flex row alignItems="center" gap="spacing16">
      <Text color="textSecondary" variant="bodySmall">
        {t('Sending')}:
      </Text>
      <Flex row alignItems="center" gap="spacing4">
        <CurrencyLogo currencyInfo={nativeCurrencyInfo} size={iconSizes.icon16} />
        <Text variant="subheadSmall">
          {formatCurrencyAmount(nativeCurrencyAmount, NumberType.TokenTx)}{' '}
          {nativeCurrencyInfo?.currency.symbol}
        </Text>
        <Text color="textSecondary" loading={!usdValue} variant="subheadSmall">
          ({formatUSDPrice(usdValue)})
        </Text>
      </Flex>
    </Flex>
  )
}
