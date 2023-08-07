import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectNftsData } from 'src/features/favorites/selectors'
import { AccountToNftData, isNftHidden, toggleNftVisibility } from 'src/features/favorites/slice'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { getNftUrl } from 'src/utils/linking'
import { PollingInterval } from 'wallet/src/constants/misc'
import { NftsQuery, useNftsQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { logger } from 'wallet/src/features/logger/logger'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import serializeError from 'wallet/src/utils/serializeError'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'

export const HIDDEN_NFTS_ROW_LEFT_ITEM = 'HIDDEN_NFTS_ROW_LEFT_ITEM'
export const HIDDEN_NFTS_ROW_RIGHT_ITEM = 'HIDDEN_NFTS_ROW_RIGHT_ITEM'
export const EMPTY_NFT_ITEM = 'EMPTY_NFT_ITEM'

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<NftsQuery['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']

export function useNFT(
  owner: Address = '',
  address?: Address,
  tokenId?: string
): GqlResult<GQLNftAsset> {
  // TODO: [MOB-227] do a direct cache lookup in Apollo using id instead of re-querying
  const { data, loading, refetch } = useNftsQuery({
    variables: { ownerAddress: owner },
    pollInterval: PollingInterval.Slow,
    skip: !owner,
  })

  const nft = useMemo(
    () =>
      data?.portfolios?.[0]?.nftBalances?.find(
        (balance) =>
          balance?.ownedAsset?.nftContract?.address === address &&
          balance?.ownedAsset?.tokenId === tokenId
      )?.ownedAsset ?? undefined,
    [data, address, tokenId]
  )

  return { data: nft, loading, refetch }
}

interface NFTMenuParams {
  tokenId?: string
  contractAddress?: Address
  owner?: Address
  showNotification?: boolean
  isSpam?: boolean
}

function shouldHideNft({
  nftsData,
  owner,
  contractAddress,
  tokenId,
  isSpam,
}: {
  nftsData: AccountToNftData
  owner: Address
  contractAddress: Address
  tokenId: string
  isSpam?: boolean
}): boolean {
  const nftKey = getNFTAssetKey(contractAddress, tokenId)
  const nftData = nftsData[owner]?.[nftKey] ?? {}
  return isNftHidden(nftData, isSpam)
}

export function useNFTMenu({
  contractAddress,
  tokenId,
  owner,
  showNotification = false,
  isSpam,
}: NFTMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
  onlyShare: boolean
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const isLocalAccount = owner && !!accounts[owner]

  const isAddressAndTokenOk = contractAddress && tokenId
  const nftsData = useAppSelector(selectNftsData)
  const hidden =
    owner &&
    isAddressAndTokenOk &&
    shouldHideNft({ nftsData, owner, contractAddress, tokenId, isSpam })

  const onPressShare = useCallback(async (): Promise<void> => {
    if (!contractAddress || !tokenId) return
    try {
      await Share.share({
        message: getNftUrl(contractAddress, tokenId),
      })
    } catch (error) {
      logger.error('Unable to share NFT Item url', {
        tags: {
          file: 'nfts/hooks',
          function: 'useNFTMenu',
          error: serializeError(error),
        },
      })
    }
  }, [contractAddress, tokenId])

  const onPressHiddenStatus = useCallback(() => {
    if (!owner || !contractAddress || !tokenId) return
    dispatch(
      toggleNftVisibility({
        owner,
        contractAddress,
        tokenId,
        isSpam,
      })
    )
    if (showNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: !hidden,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: 'NFT',
        })
      )
    }
  }, [contractAddress, dispatch, hidden, isSpam, owner, showNotification, tokenId])

  const menuActions = useMemo(
    () =>
      isAddressAndTokenOk
        ? [
            {
              title: t('Share'),
              systemIcon: 'square.and.arrow.up',
              onPress: onPressShare,
            },
            ...((isLocalAccount && [
              {
                title: hidden ? t('Unhide NFT') : t('Hide NFT'),
                systemIcon: hidden ? 'eye' : 'eye.slash',
                destructive: !hidden,
                onPress: onPressHiddenStatus,
              },
            ]) ||
              []),
          ]
        : [],
    [isAddressAndTokenOk, t, onPressShare, isLocalAccount, hidden, onPressHiddenStatus]
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress, onlyShare: !!isAddressAndTokenOk && !isLocalAccount }
}

// Apply to NFTs fetched from API hidden filter, which is stored in Redux
export function useGroupNftsByVisibility(
  nftDataItems: Array<NFTItem> | undefined,
  showHidden: boolean,
  owner: Address
): {
  nfts: Array<NFTItem | string>
  numHidden: number
} {
  const nftsData = useAppSelector(selectNftsData)
  return useMemo(() => {
    const { shown, hidden } = (nftDataItems ?? []).reduce<{
      shown: NFTItem[]
      hidden: NFTItem[]
    }>(
      (acc, item) => {
        if (
          item.contractAddress &&
          item.tokenId &&
          shouldHideNft({
            nftsData,
            owner,
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            isSpam: item.isSpam,
          })
        ) {
          acc.hidden.push(item)
        } else {
          acc.shown.push(item)
        }
        return acc
      },
      { shown: [], hidden: [] }
    )
    return {
      nfts: [
        ...shown,
        ...((hidden.length && [
          // to fill the gap for odd number of shown elements in 2 columns layout
          ...(shown.length % 2 ? [EMPTY_NFT_ITEM] : []),
          HIDDEN_NFTS_ROW_LEFT_ITEM,
          HIDDEN_NFTS_ROW_RIGHT_ITEM,
        ]) ||
          []),
        ...((showHidden && hidden) || []),
      ],
      numHidden: hidden.length,
    }
  }, [nftDataItems, nftsData, owner, showHidden])
}
