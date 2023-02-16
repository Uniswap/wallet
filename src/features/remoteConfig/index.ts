import remoteConfig, { FirebaseRemoteConfigTypes } from '@react-native-firebase/remote-config'
import { useCallback, useState } from 'react'
import { TestConfigValues } from 'src/features/remoteConfig/testConfigs'
import { printDebugLogs } from 'src/features/remoteConfig/utils'

/**
 * Returns true if config is enabled.
 * Note:
 *  - Source may be local or remote depending on fetch+activation status
 *  - Values are cached for 12 hours by Firebase
 */
export function isEnabled(config: string): boolean {
  return remoteConfig().getValue(config).asString() === 'enabled'
}

export function useTestConfigManager(): [
  [string, FirebaseRemoteConfigTypes.ConfigValue][],
  typeof toggleLocalConfig
] {
  const [testConfigs, setTestConfigs] = useState(remoteConfig().getAll())

  const _toggleLocalConfig = useCallback(async (args: LocalConfig) => {
    await toggleLocalConfig(args)

    setTestConfigs(remoteConfig().getAll())
  }, [])

  return [Object.entries(testConfigs), _toggleLocalConfig]
}

type LocalConfig = {
  config: string
  enabled: boolean
  configDefaults?: typeof TestConfigValues
}

/** Toggles a local config to the given value. */
function toggleLocalConfig({
  config,
  enabled,
  configDefaults = TestConfigValues,
}: LocalConfig): Promise<void> {
  return initializeRemoteConfig({
    ...configDefaults,
    [config]: enabled ? 'enabled' : 'disabled',
  })
}
/** Initializes Firebase Remote Config with default values. */
export async function initializeRemoteConfig(configDefaults = TestConfigValues): Promise<void> {
  await remoteConfig().setDefaults(configDefaults)
  await remoteConfig().fetchAndActivate()

  printDebugLogs()
}
