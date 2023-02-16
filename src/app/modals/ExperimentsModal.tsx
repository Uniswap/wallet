import React, { useState } from 'react'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { Switch } from 'src/components/buttons/Switch'
import { TextInput } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout/Flex'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { retrieveRemoteExperiments } from 'src/features/experiments/saga'
import {
  selectExperimentOverrides,
  selectFeatureFlagOverrides,
} from 'src/features/experiments/selectors'
import {
  addExperimentOverride,
  addFeatureFlagOverride,
  ExperimentsMap,
  FeatureFlagsMap,
  resetExperimentOverrides,
  resetFeatureFlagOverrides,
} from 'src/features/experiments/slice'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useAsyncData } from 'src/utils/hooks'

export function ExperimentsModal(): JSX.Element {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const featureFlags = useAppSelector(selectFeatureFlagOverrides)
  const experiments = useAppSelector(selectExperimentOverrides)
  const remoteConfig = useAsyncData(retrieveRemoteExperiments).data

  return (
    <BottomSheetModal
      backgroundColor={
        featureFlags['modal-color-test'] ? theme.colors.accentBranded : theme.colors.background1
      }
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}>
      <Flex gap="spacing24" justifyContent="flex-start" pb="spacing36">
        <Flex>
          <Text color="textPrimary" px="spacing24">
            Overidden feature flags and experiment variants will remain until you restart the app.
            Remote config is refreshed every time you cold-start the app, and differences show in
            color.
          </Text>
        </Flex>

        <Flex justifyContent="flex-start" px="spacing24">
          <SectionHeader
            emoji="🏴"
            title="Feature Flags"
            onResetPress={(): void => {
              if (!remoteConfig) return
              dispatch(resetFeatureFlagOverrides(remoteConfig.featureFlags))
            }}
          />
          {Object.keys(featureFlags).map((name) => {
            return (
              <FeatureFlagRow
                key={name}
                localFeatureFlags={featureFlags}
                name={name}
                remoteFeatureFlags={remoteConfig?.featureFlags}
              />
            )
          })}
        </Flex>

        <Flex justifyContent="flex-start" px="spacing24">
          <SectionHeader
            emoji="🧪"
            title="Experiments"
            onResetPress={(): void => {
              dispatch(resetExperimentOverrides(remoteConfig?.experiments || {}))
            }}
          />
          {Object.keys(experiments).map((name) => {
            return (
              <ExperimentRow
                key={name}
                localExperiments={experiments}
                name={name}
                remoteExperiments={remoteConfig?.experiments}
              />
            )
          })}
        </Flex>
        {/* // Spacer for keyboard input */}
        <Flex height={300} />
      </Flex>
    </BottomSheetModal>
  )
}

function SectionHeader({
  title,
  emoji,
  onResetPress,
}: {
  title: string
  emoji: string
  onResetPress: () => void
}): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      borderBottomColor="textPrimary"
      borderBottomWidth={0.5}
      gap="spacing12"
      justifyContent="space-between"
      py="spacing8">
      <Flex row gap="spacing12">
        <Text variant="subheadLarge">{emoji}</Text>
        <Text variant="subheadLarge">{title}</Text>
      </Flex>
      <Button
        emphasis={ButtonEmphasis.Detrimental}
        label="Reset"
        size={ButtonSize.Small}
        onPress={onResetPress}
      />
    </Flex>
  )
}

function ExperimentRow({
  name,
  localExperiments,
  remoteExperiments,
}: {
  name: string
  localExperiments: ExperimentsMap
  remoteExperiments?: ExperimentsMap
}): JSX.Element {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const [textInput, setTextInput] = useState<string | undefined>()
  const isExperimentOverridden = localExperiments[name] !== remoteExperiments?.[name]

  return (
    <Flex gap="spacing8">
      <Flex row alignItems="center" flexWrap="wrap" gap="none" justifyContent="space-between">
        <Text m="none" p="none" variant="bodyLarge">
          {name}
        </Text>
        <Flex row alignItems="center" gap="none" justifyContent="flex-end">
          <TextInput
            autoCapitalize="none"
            backgroundColor="none"
            color={isExperimentOverridden ? 'accentAction' : 'textPrimary'}
            placeholder={localExperiments[name]}
            placeholderTextColor={
              isExperimentOverridden ? theme.colors.accentAction : theme.colors.textPrimary
            }
            onChangeText={(text): void => setTextInput(text)}
          />
          <Button
            emphasis={ButtonEmphasis.Secondary}
            label="Override"
            size={ButtonSize.Small}
            onPress={(): void => {
              if (!textInput) return
              dispatch(addExperimentOverride({ name, variant: textInput }))
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

function FeatureFlagRow({
  name,
  localFeatureFlags,
  remoteFeatureFlags,
}: {
  name: string
  localFeatureFlags: FeatureFlagsMap
  remoteFeatureFlags?: FeatureFlagsMap
}): JSX.Element {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const isExperimentOverridden = localFeatureFlags[name] !== remoteFeatureFlags?.[name]

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="bodyLarge">{name}</Text>
      <Switch
        thumbColor={isExperimentOverridden ? theme.colors.accentAction : theme.colors.accentActive}
        value={localFeatureFlags[name] ?? false}
        onValueChange={(newValue: boolean): void => {
          dispatch(addFeatureFlagOverride({ name, enabled: newValue }))
        }}
      />
    </Flex>
  )
}
