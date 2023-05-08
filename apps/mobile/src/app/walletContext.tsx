/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { ChainId } from 'src/constants/chains'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { SignerManager } from 'src/features/wallet/signing/SignerManager'
import { logger } from 'src/utils/logger'
import { call, getContext } from 'typed-redux-saga'

export interface WalletContextValue {
  signers: SignerManager
  providers: ProviderManager
  contracts: ContractManager
}

export const walletContextValue: WalletContextValue = {
  signers: new SignerManager(),
  providers: new ProviderManager(),
  contracts: new ContractManager(),
}

export const WalletContext = createContext<{ value: WalletContextValue; version: number }>({
  value: walletContextValue,
  version: 0,
})

export const WalletContextProvider = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
  // This state allows the managers to trigger re-renders when relevant values change (i.e. new provider ready)
  // Probably not strictly necessary but more robust than relying on 'organic' re-renders
  const [contextVersion, updateContextVersion] = useState(0)
  const incrementContextVersion = useCallback(() => {
    logger.debug(
      'walletContext',
      'WalletContextProvider',
      `Context update count: ${contextVersion + 1}`
    )
    updateContextVersion(contextVersion + 1)
  }, [contextVersion, updateContextVersion])
  useEffect(() => {
    walletContextValue.providers.setOnUpdate(incrementContextVersion)
  }, [incrementContextVersion])

  return (
    <WalletContext.Provider value={{ value: walletContextValue, version: contextVersion }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletSigners(): SignerManager {
  return useContext(WalletContext).value.signers
}

export function* getSignerManager() {
  const signerManager = yield* getContext<SignerManager>('signers')
  return signerManager
}

export function useProviderManager(): ProviderManager {
  return useContext(WalletContext).value.providers
}

export function useProvider(chainId: ChainId) {
  return useProviderManager().tryGetProvider(chainId)
}

export function* getProviderManager() {
  const providerManager = yield* getContext<ProviderManager>('providers')
  return providerManager
}

export function* getProvider(chainId: ChainId, isFlashbots?: boolean) {
  const providerManager = yield* call(getProviderManager)
  // Note, unlike useWalletProvider above, this throws on missing provider
  return providerManager.getProvider(chainId, isFlashbots)
}

export function useContractManager(): ContractManager {
  return useContext(WalletContext).value.contracts
}

export function* getContractManager() {
  const contracts = yield* getContext<ContractManager>('contracts')
  return contracts
}
