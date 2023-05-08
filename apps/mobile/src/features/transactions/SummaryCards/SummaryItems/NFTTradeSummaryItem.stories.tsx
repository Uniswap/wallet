import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChainId } from 'src/constants/chains'
import {
  NFTTradeTransactionInfo,
  NFTTradeType,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { buildNativeCurrencyId } from 'src/utils/currencyId'
import NFTTradeSummaryItem from './NFTTradeSummaryItem'

const meta: Meta<typeof NFTTradeSummaryItem> = {
  title: 'WIP/Activity Items',
}

export default meta

const baseNFTBuyTx: Omit<TransactionDetails, 'status'> & { typeInfo: NFTTradeTransactionInfo } = {
  from: '',
  addedTime: Date.now() - 30000,
  hash: '',
  options: { request: {} },
  chainId: 1,
  id: '',
  typeInfo: {
    type: TransactionType.NFTTrade,
    tradeType: NFTTradeType.BUY,
    nftSummaryInfo: {
      collectionName: 'Froggy Friends Official',
      imageURL:
        'https://lh3.googleusercontent.com/9LokgAuB0Xqkio273GE0pY0WSJwOExFtFI1SkJT2jK-USvqFc-5if7ZP5PQ1h8s5YPimyJG5cSOdGGR2UaD3gTYMKAhj6yikYaw=s250',
      name: 'Froggy Friend #1777',
      tokenId: '1777',
    },
    purchaseCurrencyId: buildNativeCurrencyId(ChainId.Mainnet),
    purchaseCurrencyAmountRaw: '1000000000000000000',
  },
}

const baseNFTSellTx: Omit<TransactionDetails, 'status'> & { typeInfo: NFTTradeTransactionInfo } = {
  ...baseNFTBuyTx,
  typeInfo: {
    ...baseNFTBuyTx.typeInfo,
    tradeType: NFTTradeType.SELL,
  },
}

export const NFTBuy: StoryObj = {
  render: () => (
    <>
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTBuyTx,
          status: TransactionStatus.Pending,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTBuyTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTBuyTx,
          status: TransactionStatus.Cancelled,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTBuyTx,
          status: TransactionStatus.Failed,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTBuyTx,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}

export const NFTSell: StoryObj = {
  render: () => (
    <>
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTSellTx,
          status: TransactionStatus.Pending,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTSellTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTSellTx,
          status: TransactionStatus.Cancelled,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTSellTx,
          status: TransactionStatus.Failed,
        }}
      />
      <NFTTradeSummaryItem
        transaction={{
          ...baseNFTSellTx,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
