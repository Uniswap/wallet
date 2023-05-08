import { BaseTheme } from '@shopify/restyle'
import React from 'react'
import { ValueOf } from 'react-native-gesture-handler/lib/typescript/typeUtils'
import { SettingsStackNavigationProp, SettingsStackParamList } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openUri } from 'src/utils/linking'

export interface SettingsSection {
  subTitle: string
  data: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export interface SettingsSectionItemComponent {
  component: JSX.Element
  isHidden?: boolean
}

export interface SettingsSectionItem {
  screen?: keyof SettingsStackParamList
  screenProps?: ValueOf<SettingsStackParamList>
  externalLink?: string
  action?: JSX.Element
  text: string
  subText?: string
  icon: JSX.Element
  isHidden?: boolean
  currentSetting?: string
}

interface SettingsRowProps {
  page: SettingsSectionItem
  navigation: SettingsStackNavigationProp
  theme: BaseTheme
}

export function SettingsRow({
  page: { screen, screenProps, externalLink, action, icon, text, subText, currentSetting },
  navigation,
  theme,
}: SettingsRowProps): JSX.Element {
  const handleRow = (): void => {
    if (screen) {
      navigation.navigate(screen, screenProps)
    } else if (externalLink) {
      openUri(externalLink)
    }
  }
  return (
    <TouchableArea disabled={Boolean(action)} onPress={handleRow}>
      <Flex grow row alignItems="center" minHeight={40}>
        <Flex grow row alignItems={subText ? 'flex-start' : 'center'} flexBasis={0} gap="spacing12">
          <Flex centered height={32} width={32}>
            {icon}
          </Flex>
          <Flex grow alignItems="stretch" flex={1} gap="none">
            <Text numberOfLines={1} variant="bodyLarge">
              {text}
            </Text>
            {subText && (
              <Text color="textSecondary" numberOfLines={1} variant="buttonLabelMicro">
                {subText}
              </Text>
            )}
          </Flex>
        </Flex>
        {screen ? (
          <Flex centered row gap="none">
            {currentSetting ? (
              <Flex
                row
                shrink
                alignItems="flex-end"
                flexBasis="30%"
                gap="none"
                justifyContent="flex-end">
                <Text
                  adjustsFontSizeToFit
                  color="textSecondary"
                  mr="spacing8"
                  numberOfLines={1}
                  variant="bodyMicro">
                  {currentSetting}
                </Text>
              </Flex>
            ) : null}
            <Chevron color={theme.colors.textTertiary} direction="e" height={24} width={24} />
          </Flex>
        ) : externalLink ? (
          <Arrow color={theme.colors.textTertiary} direction="ne" size={24} />
        ) : (
          action
        )}
      </Flex>
    </TouchableArea>
  )
}
