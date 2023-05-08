import { Palette } from 'src/styles/color'

export enum AccountType {
  SignerMnemonic = 'signerMnemonic', // Key lives in native keystore
  Readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export enum BackupType {
  Manual = 'manual',
  Cloud = 'cloud',
}

type DynamicPalette = Pick<Palette, 'userThemeColor'>

export type AccountCustomizations = {
  palette?: DynamicPalette
  localPfp?: string
}

export interface AccountBase {
  type: AccountType
  address: Address
  name?: string
  customizations?: AccountCustomizations
  backups?: BackupType[]
  flashbotsEnabled?: boolean
  pending?: boolean
  timeImportedMs: number
  pushNotificationsEnabled?: boolean
  showSmallBalances?: boolean
  showSpamTokens?: boolean
}

export interface SignerMnemonicAccount extends AccountBase {
  type: AccountType.SignerMnemonic
  derivationIndex: number
  mnemonicId: string
}

export interface ReadOnlyAccount extends AccountBase {
  type: AccountType.Readonly
}

export type Account = SignerMnemonicAccount | ReadOnlyAccount
