// TODO(MOB-3866): reduce component complexity
/* eslint-disable complexity */
import { TradeType } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'src/features/transactions/history/utils'
import {
  ExactInputSwapTransactionInfo,
  NFTTradeTransactionInfo,
  NFTTradeType,
  TransactionListQueryResponse,
  TransactionType,
  WrapTransactionInfo,
} from 'src/features/transactions/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

export default function parseTradeTransaction(
  transaction: TransactionListQueryResponse
): ExactInputSwapTransactionInfo | NFTTradeTransactionInfo | WrapTransactionInfo | undefined {
  // for detecting wraps
  const nativeCurrencyID = buildNativeCurrencyId(ChainId.Mainnet).toLocaleLowerCase()
  const wrappedCurrencyID = buildCurrencyId(
    ChainId.Mainnet,
    WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet].address
  ).toLocaleLowerCase()

  const sent = transaction?.assetChanges.find((t) => {
    return (
      (t?.__typename === 'TokenTransfer' && t.direction === 'OUT') ||
      (t?.__typename === 'NftTransfer' && t.direction === 'OUT')
    )
  })
  const received = transaction?.assetChanges.find((t) => {
    return (
      (t?.__typename === 'TokenTransfer' && t.direction === 'IN') ||
      (t?.__typename === 'NftTransfer' && t.direction === 'IN')
    )
  })

  // Invalid input/output info
  if (!sent || !received) return undefined

  const onlyERC20Tokens =
    sent.__typename === 'TokenTransfer' && received.__typename === 'TokenTransfer'
  const containsNFT = sent.__typename === 'NftTransfer' || received.__typename === 'NftTransfer'

  // TODO: [MOB-3902] Currently no spec for advanced transfer types.
  if (!(onlyERC20Tokens || containsNFT)) {
    return undefined
  }

  // Token swap
  if (onlyERC20Tokens) {
    const inputCurrencyId =
      sent.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(ChainId.Mainnet)
        : sent.asset.address
        ? buildCurrencyId(ChainId.Mainnet, sent.asset.address)
        : null
    const outputCurrencyId =
      received.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(ChainId.Mainnet)
        : received.asset.address
        ? buildCurrencyId(ChainId.Mainnet, received.asset.address)
        : null
    const inputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      sent.tokenStandard,
      sent.quantity,
      sent.asset.decimals
    )
    const expectedOutputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      received.tokenStandard,
      received.quantity,
      received.asset.decimals
    )

    const transactedUSDValue = parseUSDValueFromAssetChange(sent.transactedValue)

    // Data API marks wrap as a swap.
    if (
      (inputCurrencyId?.toLocaleLowerCase() === nativeCurrencyID &&
        outputCurrencyId?.toLocaleLowerCase() === wrappedCurrencyID) ||
      (inputCurrencyId?.toLocaleLowerCase() === wrappedCurrencyID &&
        outputCurrencyId?.toLocaleLowerCase() === nativeCurrencyID)
    ) {
      return {
        type: TransactionType.Wrap,
        unwrapped: outputCurrencyId.toLocaleLowerCase() === nativeCurrencyID.toLocaleLowerCase(),
        currencyAmountRaw: inputCurrencyAmountRaw,
      }
    }

    if (!inputCurrencyId || !outputCurrencyId) {
      return undefined
    }
    return {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId,
      outputCurrencyId,
      transactedUSDValue,
      inputCurrencyAmountRaw,
      expectedOutputCurrencyAmountRaw,
      minimumOutputCurrencyAmountRaw: expectedOutputCurrencyAmountRaw,
    }
  }

  // NFT trade found
  if (containsNFT) {
    const nftChange = [received, sent].find((t) => t.__typename === 'NftTransfer')
    const tokenChange = [received, sent].find((t) => t.__typename === 'TokenTransfer')
    // TODO: [MOB-3903] Monitor txns where we have only NFT swaps
    if (nftChange?.__typename !== 'NftTransfer' || tokenChange?.__typename !== 'TokenTransfer') {
      return undefined
    }
    const name = nftChange.asset?.name
    const collectionName = nftChange.asset?.collection?.name
    const imageURL = nftChange.asset?.image?.url
    const tokenId = nftChange.asset?.name
    const purchaseCurrencyId =
      tokenChange.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(ChainId.Mainnet)
        : tokenChange.asset?.address
        ? buildCurrencyId(ChainId.Mainnet, tokenChange.asset.address)
        : undefined
    const purchaseCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      tokenChange.tokenStandard,
      tokenChange.quantity,
      tokenChange.asset?.decimals
    )
    const tradeType = nftChange.direction === 'IN' ? NFTTradeType.BUY : NFTTradeType.SELL

    const transactedUSDValue = parseUSDValueFromAssetChange(tokenChange.transactedValue)

    if (
      !name ||
      !collectionName ||
      !imageURL ||
      !tokenId ||
      !purchaseCurrencyId ||
      !purchaseCurrencyAmountRaw
    ) {
      return undefined
    }
    return {
      type: TransactionType.NFTTrade,
      tradeType,
      nftSummaryInfo: {
        name,
        collectionName,
        imageURL,
        tokenId,
      },
      purchaseCurrencyId,
      purchaseCurrencyAmountRaw,
      transactedUSDValue,
    }
  }
}
