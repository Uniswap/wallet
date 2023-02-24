import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useENS } from 'src/features/ens/useENS'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  AssetUpdateLayout,
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { SendTokenTransactionInfo } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'

export default function SendSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: SendTokenTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(
    transaction.typeInfo.assetType === AssetType.Currency
      ? buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
      : undefined
  )

  const icon = useMemo(() => {
    if (transaction.typeInfo.assetType === AssetType.Currency) {
      return (
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          currencyInfo={currencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      )
    }
    return (
      <LogoWithTxStatus
        assetType={AssetType.ERC721}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo?.imageURL}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    )
  }, [
    currencyInfo,
    transaction.status,
    transaction.typeInfo.assetType,
    transaction.typeInfo.nftSummaryInfo?.imageURL,
    transaction.typeInfo.type,
  ])

  const title = getTransactionTitle(transaction.status, t('Send'), t('Sent'), t)

  // Search for matching ENS
  const { name: ensName } = useENS(ChainId.Mainnet, transaction.typeInfo.recipient, true)
  const recipientName = ensName ?? shortenAddress(transaction.typeInfo.recipient)

  const endAdornement = useMemo(() => {
    if (transaction.typeInfo.assetType === AssetType.Currency) {
      if (currencyInfo && transaction.typeInfo.currencyAmountRaw) {
        return (
          <BalanceUpdate
            amountRaw={transaction.typeInfo.currencyAmountRaw}
            currency={currencyInfo.currency}
            transactedUSDValue={transaction.typeInfo.transactedUSDValue}
            transactionStatus={transaction.status}
            transactionType={transaction.typeInfo.type}
          />
        )
      }
    }
    if (
      transaction.typeInfo.assetType === AssetType.ERC1155 ||
      transaction.typeInfo.assetType === AssetType.ERC721
    ) {
      return (
        <AssetUpdateLayout
          caption={transaction.typeInfo.nftSummaryInfo?.collectionName}
          title={transaction.typeInfo.nftSummaryInfo?.name}
        />
      )
    }
  }, [
    currencyInfo,
    transaction.status,
    transaction.typeInfo.assetType,
    transaction.typeInfo.currencyAmountRaw,
    transaction.typeInfo.nftSummaryInfo?.collectionName,
    transaction.typeInfo.nftSummaryInfo?.name,
    transaction.typeInfo.transactedUSDValue,
    transaction.typeInfo.type,
  ])

  return (
    <TransactionSummaryLayout
      caption={recipientName}
      endAdornment={endAdornement}
      icon={icon}
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
