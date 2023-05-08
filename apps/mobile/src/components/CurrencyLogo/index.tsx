import React from 'react'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { iconSizes } from 'src/styles/sizing'

interface CurrencyLogoProps {
  currencyInfo: NullUndefined<CurrencyInfo>
  size?: number
  hideNetworkLogo?: boolean
}

export const STATUS_RATIO = 2 / 5

export function CurrencyLogo({
  currencyInfo,
  size = iconSizes.icon40,
  hideNetworkLogo,
}: CurrencyLogoProps): JSX.Element | null {
  if (!currencyInfo) return null

  const { currency, logoUrl } = currencyInfo
  const { chainId, symbol } = currency

  return (
    <TokenLogo
      chainId={chainId}
      hideNetworkLogo={hideNetworkLogo}
      size={size}
      symbol={symbol}
      url={logoUrl}
    />
  )
}
