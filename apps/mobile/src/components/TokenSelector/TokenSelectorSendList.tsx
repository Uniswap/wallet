import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex } from 'src/components/layout'
import { usePortfolioTokenOptions } from 'src/components/TokenSelector/hooks'

import { useAppDispatch } from 'src/app/hooks'
import { BaseCard } from 'src/components/layout/BaseCard'
import {
  OnSelectCurrency,
  SectionHeader,
  TokenSection,
  TokenSelectorList,
} from 'src/components/TokenSelector/TokenSelectorList'
import { getTokenOptionsSection } from 'src/components/TokenSelector/utils'
import { useFiatOnRampIpAddressQuery } from 'src/features/fiatOnRamp/api'

import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ChainId } from 'wallet/src/constants/chains'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useTokenSectionsForSend(chainFilter: ChainId | null): GqlResult<TokenSection[]> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const loading = !portfolioTokenOptions
  const error = !portfolioTokenOptions && portfolioTokenOptionsError

  const sections = useMemo(() => {
    return getTokenOptionsSection(t('Your tokens'), portfolioTokenOptions)
  }, [portfolioTokenOptions, t])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchPortfolioTokenOptions,
    }),
    [error, loading, refetchPortfolioTokenOptions, sections]
  )
}

function EmptyList({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const { data: ipAddressData, isLoading } = useFiatOnRampIpAddressQuery()
  const dispatch = useAppDispatch()

  const fiatOnRampEligible = Boolean(ipAddressData?.isBuyAllowed)

  const onEmptyActionPress = (): void => {
    onClose()
    dispatch(closeModal({ name: ModalName.Send }))
    if (fiatOnRampEligible) {
      dispatch(openModal({ name: ModalName.FiatOnRamp }))
    } else {
      dispatch(
        openModal({
          name: ModalName.WalletConnectScan,
          initialState: ScannerModalState.WalletQr,
        })
      )
    }
  }

  return (
    <Flex>
      <SectionHeader title={t('Your tokens')} />
      <Box paddingHorizontal="spacing16" paddingTop="spacing16">
        {isLoading ? (
          <Flex centered row flexDirection="row" gap="spacing4" mt="spacing60" p="spacing4">
            <SpinningLoader color="textTertiary" size={iconSizes.icon64} />
          </Flex>
        ) : (
          <BaseCard.EmptyState
            buttonLabel={fiatOnRampEligible ? t('Buy crypto') : t('Receive tokens')}
            description={
              fiatOnRampEligible
                ? t('Buy crypto with a card or bank to send tokens.')
                : t('Transfer tokens from a centralized exchange or another wallet to send tokens.')
            }
            title={t('No tokens yet')}
            onPress={onEmptyActionPress}
          />
        )}
      </Box>
    </Flex>
  )
}

function _TokenSelectorSendList({
  onSelectCurrency,
  chainFilter,
  onClose,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: ChainId | null
  onClose: () => void
}): JSX.Element {
  const { data: sections, loading, error, refetch } = useTokenSectionsForSend(chainFilter)
  const emptyElement = useMemo(() => <EmptyList onClose={onClose} />, [onClose])

  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSendList = memo(_TokenSelectorSendList)
