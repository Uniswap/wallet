import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  usePopularTokensOptions,
  usePortfolioTokenOptions,
} from 'src/components/TokenSelector/hooks'
import {
  OnSelectCurrency,
  TokenSelectorList,
  TokenSelectorListSections,
} from 'src/components/TokenSelector/TokenSelectorList'
import { getTokenOptionsSection, tokenOptionDifference } from 'src/components/TokenSelector/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useTokenSectionsForSwapInput(
  chainFilter: ChainId | null
): GqlResult<TokenSelectorListSections> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptions(activeAccountAddress, chainFilter ?? ChainId.Mainnet)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError)

  const loading = !portfolioTokenOptions || !popularTokenOptions

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
  }, [refetchPopularTokenOptions, refetchPortfolioTokenOptions])

  const sections = useMemo(() => {
    if (loading) return

    const popularMinusPortfolioTokens = tokenOptionDifference(
      popularTokenOptions,
      portfolioTokenOptions
    )
    return [
      ...(getTokenOptionsSection(t('Your tokens'), portfolioTokenOptions) ?? []),
      ...(getTokenOptionsSection(t('Popular tokens'), popularMinusPortfolioTokens) ?? []),
    ]
  }, [loading, popularTokenOptions, portfolioTokenOptions, t])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections]
  )
}

function _TokenSelectorSwapInputList({
  onSelectCurrency,
  chainFilter,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: ChainId | null
}): JSX.Element {
  const { data: sections, loading, error, refetch } = useTokenSectionsForSwapInput(chainFilter)
  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
