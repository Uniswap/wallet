import { getDefaultLightAccountFactory, LightSmartContractAccount } from '@alchemy/aa-accounts'
import { AlchemyProvider } from '@alchemy/aa-alchemy'
import { HttpTransport, PublicErc4337Client, type SmartAccountSigner } from '@alchemy/aa-core'
import { useCallback, useState } from 'react'
import { arbitrumGoerli } from 'viem/chains'

export const chain = arbitrumGoerli
export const entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
export const lightAccountFactoryAddress = getDefaultLightAccountFactory(chain)
export const alchemyApiKey = '_PkhThHf-qrSxbQGCp2QIKU84-CX90UP'

export const useAlchemyProvider = () => {
  const [provider, setProvider] = useState<AlchemyProvider>(
    new AlchemyProvider({
      apiKey: alchemyApiKey,
      chain,
      entryPointAddress,
    })
  )

  const connectProviderToAccount: (signer: SmartAccountSigner) => AlchemyProvider = useCallback(
    (signer: SmartAccountSigner) => {
      const connectedProvider = provider.connect(
        (rpcClient: string | PublicErc4337Client<HttpTransport>) =>
          new LightSmartContractAccount({
            rpcClient,
            owner: signer,
            chain,
            entryPointAddress,
            factoryAddress: lightAccountFactoryAddress,
          })
      )
      // .withAlchemyGasManager({
      //   policyId: gasManagerPolicyId,
      //   entryPoint: entryPointAddress,
      // });

      setProvider(connectedProvider)

      console.log(
        '[useAlchemyProvider] Alchemy Provider connected to account %s \
        (Signer type %s, Gas Manager Policy ID %s, Entry Point Address %s, Factory Address %s)',
        connectedProvider.account,
        signer.signerType,
        '', // gasManagerPolicyId,
        entryPointAddress,
        lightAccountFactoryAddress
      )

      return connectedProvider
    },
    [provider]
  )

  const disconnectProviderFromAccount: () => AlchemyProvider = useCallback(() => {
    const disconnectedProvider = provider.disconnect()

    setProvider(disconnectedProvider)
    return disconnectedProvider
  }, [provider])

  return {
    provider,
    connectProviderToAccount,
    disconnectProviderFromAccount,
  }
}
