import React from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import {
  WalletConnectSession,
  WalletConnectSessionV1,
} from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'
import { openUri } from 'src/utils/linking'

export function DappConnectionItem({
  session,
  onPressChangeNetwork,
}: {
  session: WalletConnectSession
  onPressChangeNetwork: (session: WalletConnectSessionV1) => void
}): JSX.Element {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'
  const { dapp } = session

  return (
    <Flex
      bg={isDarkMode ? 'background1' : 'background2'}
      borderRadius="rounded12"
      gap="spacing16"
      justifyContent="space-between"
      mb="spacing12"
      p="spacing16"
      width="48%">
      <TouchableArea
        flex={1}
        name={ElementName.WCOpenDapp}
        onPress={(): Promise<void> => openUri(dapp.url)}>
        <Flex centered grow gap="spacing8">
          {dapp.icon ? (
            <Flex>
              <RemoteImage
                borderRadius={theme.borderRadii.none}
                height={40}
                uri={dapp.icon}
                width={40}
              />
            </Flex>
          ) : null}
          <Text numberOfLines={2} textAlign="center" variant="buttonLabelMedium">
            {dapp.name || dapp.url}
          </Text>
          <Text
            color="accentActive"
            numberOfLines={1}
            textAlign="center"
            variant="buttonLabelMicro">
            {dapp.url}
          </Text>
        </Flex>
      </TouchableArea>
      {session.version === '1' ? (
        <ChangeNetworkButton session={session} onPressChangeNetwork={onPressChangeNetwork} />
      ) : (
        <Flex centered>
          <Box
            flexDirection="row"
            height={theme.iconSizes.icon28}
            width={
              theme.iconSizes.icon28 +
              (session.chains.length - 1) * theme.iconSizes.icon28 * (2 / 3)
            }>
            {session.chains.map((chainId, index) => (
              <Box
                key={chainId}
                left={index * theme.iconSizes.icon28 * (2 / 3)}
                position="absolute">
                <NetworkLogo chainId={chainId} size={theme.iconSizes.icon28} />
              </Box>
            ))}
          </Box>
        </Flex>
      )}
    </Flex>
  )
}

function ChangeNetworkButton({
  session,
  onPressChangeNetwork,
}: {
  session: WalletConnectSessionV1
  onPressChangeNetwork: (session: WalletConnectSessionV1) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()

  // Only WC v1.0 connections have a current chain_id
  const supportedChainId = toSupportedChainId(session.dapp.chain_id)

  return (
    <TouchableArea
      name={ElementName.WCDappSwitchNetwork}
      onPress={(): void => onPressChangeNetwork(session)}>
      <Flex
        row
        shrink
        borderColor="backgroundOutline"
        borderRadius="rounded16"
        borderWidth={1}
        gap="none"
        justifyContent="space-between"
        p="spacing8">
        {supportedChainId ? (
          <Flex fill row shrink gap="spacing8">
            <NetworkLogo chainId={supportedChainId} />
            <Flex shrink>
              <Text color="textSecondary" numberOfLines={1} variant="buttonLabelSmall">
                {CHAIN_INFO[supportedChainId].label}
              </Text>
            </Flex>
          </Flex>
        ) : (
          <Text color="textSecondary" textAlign="center" variant="buttonLabelSmall">
            {t('Unsupported chain')}
          </Text>
        )}
        <Chevron color={theme.colors.textTertiary} direction="s" height="20" width="20" />
      </Flex>
    </TouchableArea>
  )
}
