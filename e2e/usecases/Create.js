import { by, device, element, expect } from 'detox'
import { ElementName } from '../../src/features/telemetry/constants'
import { sleep } from '../../src/utils/timing'
import { Accounts } from '../utils/fixtures'

export function Create() {
  it('onboards a new account', async () => {
    await device.setBiometricEnrollment(true)

    await element(by.id(ElementName.OnboardingCreateWallet)).tap()

    // Name
    await element(by.id('customize/name')).typeText(`${Accounts.managed.name}`)
    await element(by.id('customize/name')).tapReturnKey()
    await element(by.id(ElementName.Next)).tap()

    // Choose a color
    await element(by.id(ElementName.SelectColor + '-' + '#FC72FF')).tap()
    await element(by.id(ElementName.Next)).tap()

    // Backups

    // Manual Backup
    await element(by.id(ElementName.AddManualBackup)).tap()
    await element(by.id(ElementName.Next)).tap()
    await element(by.id(ElementName.Confirm)).tap()

    // view native mnemonic
    await element(by.id(ElementName.Next)).tap()
    // finish viewing native mnemonic
    await element(by.id(ElementName.Next)).tap()

    await sleep(1000)

    // Push notifications
    await element(by.id(ElementName.Enable)).tap()

    // Face ID
    await element(by.id(ElementName.Enable)).tap()

    // Outro
    await element(by.id(ElementName.Next)).tap()

    // Home screen
    await expect(
      element(by.id(`address-display/name/${Accounts.managed.name}`)).atIndex(0)
    ).toBeVisible()
  })
}
