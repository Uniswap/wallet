import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedGradient } from 'src/components/gradients/UniconThemedGradient'
import { AnimatedFlex } from 'src/components/layout'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { Text } from 'src/components/Text'
import { useUniconColors } from 'src/components/unicons/utils'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { openUri } from 'src/utils/linking'
import { SUPPORTED_NETWORKS_PAGE_URL } from 'wallet/src/constants/urls'

const QR_CODE_SIZE = 220
const UNICON_SIZE = QR_CODE_SIZE / 2.8

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props): JSX.Element | null {
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()
  const gradientData = useUniconColors(address)
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(SUPPORTED_NETWORKS_PAGE_URL)
  }

  if (!address) return null

  return (
    <>
      <GradientBackground>
        <UniconThemedGradient
          middleOut
          borderRadius="rounded16"
          gradientEndColor={theme.colors.background0}
          gradientStartColor={gradientData.glow}
          opacity={isDarkMode ? 0.24 : 0.2}
        />
      </GradientBackground>
      <AnimatedFlex
        centered
        grow
        entering={FadeIn}
        exiting={FadeOut}
        gap="spacing24"
        mb="spacing48"
        mx="spacing60"
        py="spacing24">
        <AddressDisplay
          showCopy
          showCopyWrapperButton
          address={address}
          captionVariant="bodyLarge"
          showAccountIcon={false}
          variant="headlineSmall"
        />
        <QRCodeDisplay
          hideOutline
          address={address}
          backgroundColor="background0"
          containerBackgroundColor="background0"
          displayShadow={true}
          logoSize={UNICON_SIZE}
          overlayOpacityPercent={10}
          safeAreaColor="background0"
          size={QR_CODE_SIZE}
        />
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {t(
            'Only send tokens on Ethereum, Optimism, Polygon, and Arbitrum networks to this address.'
          )}{' '}
          <TouchableArea height={18} onPress={onPressLearnMore}>
            <Text color="accentActive" variant="buttonLabelSmall">
              {t('Learn more')}
            </Text>
          </TouchableArea>
        </Text>
      </AnimatedFlex>
    </>
  )
}
