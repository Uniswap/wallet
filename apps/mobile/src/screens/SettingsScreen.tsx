import { useTheme } from '@shopify/restyle'
import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ListRenderItemInfo, SectionList, StyleSheet } from 'react-native'
import { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { APP_FEEDBACK_LINK, GET_HELP_LINK } from 'src/constants/urls'
import { useCurrentAppearanceSetting, useIsDarkMode } from 'src/features/appearance/hooks'
import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/hooks'
import { Screens } from 'src/screens/Screens'
import { getFullAppVersion } from 'src/utils/version'
import { AVATARS_DARK, AVATARS_LIGHT } from 'ui/src/assets'
import BookOpenIcon from 'ui/src/assets/icons/book-open.svg'
import ContrastIcon from 'ui/src/assets/icons/contrast.svg'
import FaceIdIcon from 'ui/src/assets/icons/faceid.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import LikeSquare from 'ui/src/assets/icons/like-square.svg'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import MessageQuestion from 'ui/src/assets/icons/message-question.svg'
import UniswapIcon from 'ui/src/assets/icons/uniswap-logo.svg'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { AccountType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { resetWallet, setFinishedOnboarding } from 'wallet/src/features/wallet/slice'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'
import { useTimeout } from 'wallet/src/utils/timing'

export function SettingsScreen(): JSX.Element {
  const navigation = useSettingsStackNavigation()
  const theme = useTheme()
  const { t } = useTranslation()

  // check if device supports biometric authentication, if not, hide option
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } =
    useDeviceSupportsBiometricAuth()
  const authenticationTypeName = isTouchIdSupported ? 'Touch' : 'Face'

  const currentAppearanceSetting = useCurrentAppearanceSetting()

  const sections: SettingsSection[] = useMemo((): SettingsSection[] => {
    const iconProps: SvgProps = {
      color: theme.colors.textTertiary,
      height: 24,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      width: 24,
    }

    // Defining them inline instead of outside component b.c. they need t()
    return [
      {
        subTitle: t('App settings'),
        data: [
          {
            screen: Screens.SettingsAppearance,
            text: t('Appearance'),
            currentSetting:
              currentAppearanceSetting === 'system'
                ? t('Device settings')
                : currentAppearanceSetting === 'dark'
                ? t('Dark mode')
                : t('Light mode'),
            icon: <ContrastIcon {...iconProps} />,
          },
          {
            screen: Screens.SettingsBiometricAuth,
            isHidden: !isTouchIdSupported && !isFaceIdSupported,
            text: t('{{authenticationTypeName}} ID', { authenticationTypeName }),
            icon: isTouchIdSupported ? (
              <FingerprintIcon {...iconProps} />
            ) : (
              <FaceIdIcon {...iconProps} />
            ),
          },
          // @TODO: [MOB-250] add back testnet toggle once we support testnets
        ],
      },
      {
        subTitle: t('Support'),
        data: [
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: APP_FEEDBACK_LINK,
              headerTitle: t('Send Feedback'),
            },
            text: t('Send Feedback'),
            icon: <LikeSquare {...iconProps} />,
          },
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: GET_HELP_LINK,
              headerTitle: t('Get Help'),
            },
            text: t('Get Help'),
            icon: <MessageQuestion {...iconProps} />,
          },
        ],
      },
      {
        subTitle: t('About'),
        data: [
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: uniswapUrls.privacyPolicyUrl,
              headerTitle: t('Privacy Policy'),
            },
            text: t('Privacy Policy'),
            icon: <LockIcon {...iconProps} />,
          },
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: uniswapUrls.termsOfServiceUrl,
              headerTitle: t('Terms of Service'),
            },
            text: t('Terms of Service'),
            icon: <BookOpenIcon {...iconProps} />,
          },
        ],
      },
      {
        subTitle: t('Developer settings'),
        isHidden: !__DEV__,
        data: [
          {
            screen: Screens.SettingsChains,
            text: t('Chains'),
            icon: <UniswapIcon {...iconProps} />,
          },
          {
            screen: Screens.Dev,
            text: t('Dev Options'),
            icon: <UniswapIcon {...iconProps} />,
          },
          { component: <OnboardingRow iconProps={iconProps} /> },
        ],
      },
    ]
  }, [
    theme.colors.textTertiary,
    t,
    currentAppearanceSetting,
    isTouchIdSupported,
    isFaceIdSupported,
    authenticationTypeName,
  ])

  const renderItem = ({
    item,
  }: ListRenderItemInfo<
    SettingsSectionItem | SettingsSectionItemComponent
  >): JSX.Element | null => {
    if (item.isHidden) return null
    if ('component' in item) return item.component
    return <SettingsRow key={item.screen} navigation={navigation} page={item} theme={theme} />
  }

  return (
    <HeaderScrollScreen
      alwaysShowCenterElement
      centerElement={<Text variant="bodyLarge">{t('Settings')}</Text>}>
      <Flex px="spacing24" py="spacing12">
        <SectionList
          ItemSeparatorComponent={renderItemSeparator}
          ListFooterComponent={<FooterSettings />}
          ListHeaderComponent={<WalletSettings />}
          initialNumToRender={20}
          keyExtractor={(_item, index): string => 'settings' + index}
          renderItem={renderItem}
          renderSectionFooter={(): JSX.Element => <Flex pt="spacing24" />}
          renderSectionHeader={({ section: { subTitle } }): JSX.Element => (
            <Box bg="background0" pb="spacing12">
              <Text color="textSecondary" variant="bodyLarge">
                {subTitle}
              </Text>
            </Box>
          )}
          sections={sections.filter((p) => !p.isHidden)}
          showsVerticalScrollIndicator={false}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="spacing8" />

function OnboardingRow({ iconProps }: { iconProps: SvgProps }): JSX.Element {
  const theme = useTheme()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigation = useSettingsStackNavigation()

  return (
    <TouchableArea
      onPress={(): void => {
        navigation.goBack()
        dispatch(resetWallet())
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      }}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" py="spacing4">
        <Box alignItems="center" flexDirection="row">
          <Flex centered height={32} width={32}>
            <UniswapIcon {...iconProps} />
          </Flex>
          <Text ml="spacing12" variant="bodyLarge">
            {t('Onboarding')}
          </Text>
        </Box>
        <Chevron color={theme.colors.textTertiary} direction="e" height={24} width={24} />
      </Box>
    </TouchableArea>
  )
}

function WalletSettings(): JSX.Element {
  const DEFAULT_ACCOUNTS_TO_DISPLAY = 5

  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useSettingsStackNavigation()
  const addressToAccount = useAccounts()
  const [showAll, setShowAll] = useState(false)

  const allAccounts = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return a.derivationIndex - b.derivationIndex
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return [..._mnemonicWallets, ..._viewOnlyWallets]
  }, [addressToAccount])

  const toggleViewAll = (): void => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: string): void => {
    navigation.navigate(Screens.SettingsWallet, { address })
  }

  return (
    <Box flexDirection="column" mb="spacing16">
      <Flex row justifyContent="space-between">
        <Text color="textSecondary" variant="bodyLarge">
          {t('Wallet settings')}
        </Text>
        {allAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY && (
          <TouchableArea onPress={toggleViewAll}>
            <Text color="textSecondary" mb="spacing12" variant="subheadSmall">
              {showAll ? t('View less') : t('View all')}
            </Text>
          </TouchableArea>
        )}
      </Flex>
      {allAccounts
        .slice(0, showAll ? allAccounts.length : DEFAULT_ACCOUNTS_TO_DISPLAY)
        .map((account) => (
          <TouchableArea
            key={account.address}
            pl="spacing4"
            py="spacing12"
            onPress={(): void => handleNavigation(account.address)}>
            <Box alignItems="center" flexDirection="row" justifyContent="space-between">
              <Flex shrink>
                <AddressDisplay
                  address={account.address}
                  captionVariant="subheadSmall"
                  size={theme.iconSizes.icon40}
                  variant="bodyLarge"
                />
              </Flex>
              <Chevron color={theme.colors.textTertiary} direction="e" height={24} width={24} />
            </Box>
          </TouchableArea>
        ))}
    </Box>
  )
}

function FooterSettings(): JSX.Element {
  const { t } = useTranslation()
  const [showSignature, setShowSignature] = useState(false)
  const isDarkMode = useIsDarkMode()

  // Fade out signature after duration
  useTimeout(
    showSignature
      ? (): void => {
          setShowSignature(false)
        }
      : (): void => undefined,
    SIGNATURE_VISIBLE_DURATION
  )

  return (
    <Flex gap="spacing12">
      {showSignature ? (
        <AnimatedFlex
          alignItems="center"
          entering={FadeInDown}
          exiting={FadeOutUp}
          gap="none"
          mt="spacing16">
          <Flex gap="spacing4">
            <Text color="textTertiary" textAlign="center" variant="bodySmall">
              {t('Made with love, ')}
            </Text>
            <Text color="textTertiary" textAlign="center" variant="bodySmall">
              {t('Uniswap Team 🦄')}
            </Text>
          </Flex>
          {isDarkMode ? (
            <Image source={AVATARS_DARK} style={ImageStyles.responsiveImage} />
          ) : (
            <Image source={AVATARS_LIGHT} style={ImageStyles.responsiveImage} />
          )}
        </AnimatedFlex>
      ) : null}
      <Text
        color="textTertiary"
        mt="spacing8"
        variant="bodySmall"
        onLongPress={(): void => {
          setShowSignature(true)
        }}>
        {`Version ${getFullAppVersion()}`}
      </Text>
    </Flex>
  )
}

const ImageStyles = StyleSheet.create({
  responsiveImage: {
    aspectRatio: 135 / 76,
    height: undefined,
    width: '100%',
  },
})

const SIGNATURE_VISIBLE_DURATION = ONE_SECOND_MS * 10
