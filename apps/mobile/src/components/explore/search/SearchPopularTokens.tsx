import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { getSearchResultId } from 'src/components/explore/search/utils'
import { Inset } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/searchHistorySlice'
import { ChainId } from 'wallet/src/constants/chains'
import {
  Chain,
  SearchPopularTokensQuery,
  useSearchPopularTokensQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import { getWrappedNativeCurrencyAddressForChain } from 'wallet/src/utils/currencyId'

export function SearchPopularTokens(): JSX.Element {
  // Load popular tokens by top Uniswap trading volume
  const { data, loading } = useSearchPopularTokensQuery()

  const popularTokens = useMemo(() => {
    if (!data || !data.topTokens) return

    // special case to replace weth with eth because the backend does not return eth data
    // eth will be defined only if all the required data is available
    // when eth data is not fully available, we do not replace weth with eth
    const eth = data?.eth && data?.eth.length > 0 && data?.eth?.[0]?.project ? data.eth[0] : null
    const wethAddress = getWrappedNativeCurrencyAddressForChain(ChainId.Mainnet)

    return data.topTokens
      .map((token) => {
        if (!token) return

        const isWeth =
          areAddressesEqual(token.address, wethAddress) && token?.chain === Chain.Ethereum

        // manually replace weth with eth given backend only returns eth data as a proxy for eth
        if (isWeth && eth) {
          return gqlTokenToTokenSearchResult(eth)
        }

        return gqlTokenToTokenSearchResult(token)
      })
      .filter((t): t is TokenSearchResult => Boolean(t))
  }, [data])

  if (loading) {
    return (
      <Inset all="spacing8">
        <Loader.Token repeat={2} />
      </Inset>
    )
  }

  return (
    <FlatList
      data={popularTokens}
      keyExtractor={getSearchResultId}
      listKey="tokens"
      renderItem={renderTokenItem}
    />
  )
}

function gqlTokenToTokenSearchResult(
  token: Maybe<NonNullable<NonNullable<SearchPopularTokensQuery['topTokens']>[0]>>
): TokenSearchResult | null {
  if (!token || !token.project) return null

  const { chain, address, symbol, project } = token
  const { name } = project
  const chainId = fromGraphQLChain(chain)
  if (!chainId || !symbol || !name) return null

  return {
    type: SearchResultType.Token,
    chainId,
    address,
    name,
    symbol,
    logoUrl: project?.logoUrl,
  } as TokenSearchResult
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)
