import dayjs from 'dayjs'
import { call, put } from 'typed-redux-saga'
import {
  AccountType,
  BackupType,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { addAccount } from 'wallet/src/features/wallet/slice'
import { appSelect } from 'wallet/src/state'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

interface CreateAccountParams {
  validatedPassword: string
}

export function* createAccount(params: CreateAccountParams) {
  const sortedMnemonicAccounts: SignerMnemonicAccount[] = yield* appSelect(
    selectSortedSignerMnemonicAccounts
  )
  const { nextDerivationIndex, mnemonicId, existingBackups } = yield* call(
    getNewAccountParams,
    params.validatedPassword,
    sortedMnemonicAccounts
  )
  const address = yield* call(
    [Keyring, Keyring.generateAndStorePrivateKey],
    mnemonicId,
    nextDerivationIndex,
    params.validatedPassword
  )
  yield* put(
    addAccount({
      type: AccountType.SignerMnemonic,
      address,
      pending: true,
      timeImportedMs: dayjs().valueOf(),
      derivationIndex: nextDerivationIndex,
      mnemonicId,
      backups: existingBackups,
    })
  )
  // in mobile we activate the account here, but on web we wait for a later stage of onboarding to activate it, in case the onboarding flow gets abandoned
}

async function getNewAccountParams(
  password: string,
  sortedAccounts: SignerMnemonicAccount[]
): Promise<{
  nextDerivationIndex: number
  mnemonicId: string
  existingBackups?: BackupType[]
}> {
  if (sortedAccounts.length === 0 || !sortedAccounts[0]) {
    const mnemonicId = await Keyring.generateAndStoreMnemonic(password)
    return { nextDerivationIndex: 0, mnemonicId }
  }
  return {
    nextDerivationIndex: getNextDerivationIndex(sortedAccounts),
    mnemonicId: sortedAccounts[0].mnemonicId,
    existingBackups: sortedAccounts[0].backups,
  }
}

function getNextDerivationIndex(sortedAccounts: SignerMnemonicAccount[]): number {
  // if there is a missing index in the series (0, 1, _, 3), return this missing index
  let nextIndex = 0
  for (const account of sortedAccounts) {
    if (account.derivationIndex !== nextIndex) {
      return Math.min(account.derivationIndex, nextIndex)
    }
    nextIndex += 1
  }
  // if all exist, nextDerivation = sortedMnemonicAccounts.length + 1
  return nextIndex
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga<CreateAccountParams>(createAccount, 'createAccount')
