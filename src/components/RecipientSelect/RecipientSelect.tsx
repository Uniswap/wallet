import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import ScanQRIcon from 'src/assets/icons/scan.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { filterRecipientByNameAndAddress } from 'src/components/RecipientSelect/filter'
import { useRecipients } from 'src/components/RecipientSelect/hooks'
import { RecipientList, RecipientLoadingRow } from 'src/components/RecipientSelect/RecipientList'
import { RecipientScanModal } from 'src/components/RecipientSelect/RecipientScanModal'
import { filterSections } from 'src/components/RecipientSelect/utils'
import { Text } from 'src/components/Text'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
import { ElementName } from 'src/features/telemetry/constants'

interface RecipientSelectProps {
  onSelectRecipient: (newRecipientAddress: string) => void
  onToggleShowRecipientSelector: () => void
  recipient?: string
}

function QRScannerIconButton({ onPress }: { onPress: () => void }): JSX.Element {
  const theme = useAppTheme()

  return (
    <TouchableArea hapticFeedback name={ElementName.SelectRecipient} onPress={onPress}>
      <ScanQRIcon
        color={theme.colors.textSecondary}
        height={theme.iconSizes.icon20}
        width={theme.iconSizes.icon20}
      />
    </TouchableArea>
  )
}

export function _RecipientSelect({
  onSelectRecipient,
  onToggleShowRecipientSelector,
  recipient,
}: RecipientSelectProps): JSX.Element {
  const { t } = useTranslation()
  const [showQRScanner, setShowQRScanner] = useState(false)
  const { sections, searchableRecipientOptions, pattern, onChangePattern, loading } =
    useRecipients()

  const filteredSections = useMemo(() => {
    const filteredAddresses = filterRecipientByNameAndAddress(
      pattern,
      searchableRecipientOptions
    ).map((item) => item.data.address)
    return filterSections(sections, filteredAddresses)
  }, [pattern, searchableRecipientOptions, sections])

  const onPressQRScanner = useCallback(() => {
    Keyboard.dismiss()
    setShowQRScanner(true)
  }, [setShowQRScanner])

  const onCloseQRScanner = useCallback(() => {
    setShowQRScanner(false)
  }, [setShowQRScanner])

  const noResults = pattern && pattern?.length > 0 && !loading && filteredSections.length === 0

  return (
    <>
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="spacing12" px="spacing16" width="100%">
        <SearchBar
          autoFocus
          backgroundColor="background2"
          endAdornment={<QRScannerIconButton onPress={onPressQRScanner} />}
          hideBackButton={!recipient}
          placeholder={t('Search addresses or ENS names')}
          value={pattern ?? ''}
          onBack={onToggleShowRecipientSelector}
          onChangeText={onChangePattern}
        />
        {loading && <RecipientLoadingRow />}
        {noResults ? (
          <Flex centered gap="spacing12" mt="spacing24" px="spacing24">
            <Text variant="buttonLabelMedium">{t('No results found')}</Text>
            <Text color="textTertiary" textAlign="center" variant="bodyLarge">
              {t('The address you typed either does not exist or is spelled incorrectly.')}
            </Text>
          </Flex>
        ) : (
          // Show either suggested recipients or filtered sections based on query
          <RecipientList
            sections={filteredSections.length === 0 ? sections : filteredSections}
            onPress={onSelectRecipient}
          />
        )}
      </AnimatedFlex>
      {showQRScanner && (
        <RecipientScanModal onClose={onCloseQRScanner} onSelectRecipient={onSelectRecipient} />
      )}
    </>
  )
}

export const RecipientSelect = memo(_RecipientSelect)
