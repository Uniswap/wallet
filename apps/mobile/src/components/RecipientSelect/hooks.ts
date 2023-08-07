import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from 'src/app/hooks'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { uniqueAddressesOnly } from 'src/components/RecipientSelect/utils'
import { selectRecipientsByRecency } from 'src/features/transactions/selectors'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { selectInactiveAccounts } from 'wallet/src/features/wallet/selectors'
import { getValidAddress } from 'wallet/src/utils/addresses'

const MAX_RECENT_RECIPIENTS = 15

type RecipientSection = {
  title: string
  data: SearchableRecipient[]
}

function useValidatedSearchedAddress(searchTerm: string | null): {
  recipient: SearchableRecipient[]
  loading: boolean
} {
  const { loading, address: ensAddress, name } = useENS(ChainId.Mainnet, searchTerm, true)
  return useMemo(() => {
    const address =
      getValidAddress(searchTerm, true, false) || getValidAddress(ensAddress, true, false)
    const validatedRecipient = address ? { address, name } : null
    const recipient = validatedRecipient ? [validatedRecipient] : []
    return { recipient, loading }
  }, [name, loading, searchTerm, ensAddress])
}

export function useRecipients(): {
  sections: RecipientSection[]
  searchableRecipientOptions: {
    data: SearchableRecipient
    key: string
  }[]
  pattern: string | null
  onChangePattern: (newPattern: string | null) => void
  loading: boolean
} {
  const { t } = useTranslation()

  const [pattern, setPattern] = useState<string | null>(null)

  const inactiveLocalAccounts = useAppSelector(selectInactiveAccounts)
  const recentRecipients = useAppSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const { recipient: validatedAddressRecipient, loading } = useValidatedSearchedAddress(pattern)

  const sections = useMemo(() => {
    const sectionsArr = []
    if (validatedAddressRecipient.length) {
      sectionsArr.push({
        title: t('Search Results'),
        data: validatedAddressRecipient,
      })
    }

    if (recentRecipients.length) {
      sectionsArr.push({
        title: t('Recent'),
        data: recentRecipients,
      })
    }

    if (inactiveLocalAccounts.length) {
      sectionsArr.push({
        title: t('Your wallets'),
        data: inactiveLocalAccounts,
      })
    }

    return sectionsArr
  }, [validatedAddressRecipient, recentRecipients, t, inactiveLocalAccounts])

  const searchableRecipientOptions = useMemo(
    () =>
      uniqueAddressesOnly([
        ...validatedAddressRecipient,
        ...inactiveLocalAccounts,
        ...recentRecipients,
      ]).map((item) => ({ data: item, key: item.address })),
    [recentRecipients, validatedAddressRecipient, inactiveLocalAccounts]
  )

  const onChangePattern = useCallback((newPattern: string | null) => setPattern(newPattern), [])

  return useMemo(
    () => ({
      sections,
      searchableRecipientOptions,
      pattern,
      onChangePattern,
      loading,
    }),
    [pattern, onChangePattern, searchableRecipientOptions, sections, loading]
  )
}
