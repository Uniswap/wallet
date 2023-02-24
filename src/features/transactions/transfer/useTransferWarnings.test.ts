import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/modals/WarningModal/types'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { GQLNftAsset } from 'src/features/nfts/hooks'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { getTransferWarnings } from 'src/features/transactions/transfer/useTransferWarnings'
import { networkDown, networkUnknown, networkUp, uniCurrencyInfo } from 'src/test/fixtures'
import { isOffline } from '../utils'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const emptyTransferInfo: Pick<
  DerivedTransferInfo,
  'currencyTypes' | 'currencies' | 'exactAmountToken' | 'exactCurrencyField' | 'exactAmountUSD'
> = {
  currencyTypes: {
    [CurrencyField.INPUT]: AssetType.Currency,
  },
  currencies: {
    [CurrencyField.INPUT]: undefined,
  },
  // these numbers don't really match up but that's ok
  exactAmountToken: '10000',
  exactAmountUSD: '',
  exactCurrencyField: CurrencyField.INPUT,
}

const transferState: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo,
  nftIn: undefined,
}

const transferState2: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo,
  nftIn: undefined,
}

const mockNFT = {
  id: '1',
  collection: {
    id: '123',
    collectionId: '123',
    description: null,
    image: null,
    isVerified: true,
    markets: [],
    name: 'BAYC',
    numAssets: 10,
  },
  name: 'BAYC1',
  description: null,
  image: null,
  thumbnail: null,
  tokenId: '1',
  nftContract: { id: '2', address: '0xNFTAddress', chain: 'ETHEREUM', standard: null },
  creator: {
    id: '3',
    address: '0xCreateAddress',
    username: 'Username',
  },
} as GQLNftAsset

const transferNFT: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyTypes: {
    [CurrencyField.INPUT]: AssetType.ERC721,
  },
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: undefined,
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: undefined,
  nftIn: mockNFT,
}

const transferCurrency: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo,
  nftIn: undefined,
}

const insufficientBalanceState: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo,
  nftIn: undefined,
}

const mockTranslate = jest.fn()

describe(getTransferWarnings, () => {
  it('does not error when Currency with balances and amounts is provided', () => {
    const warnings = getTransferWarnings(mockTranslate, transferCurrency, isOffline(networkUp))
    expect(warnings.length).toBe(0)
  })

  it('errors if there is no internet', () => {
    const warnings = getTransferWarnings(mockTranslate, transferCurrency, isOffline(networkDown))
    expect(warnings.length).toBe(1)
  })

  it('does not error when network state is unknown', () => {
    const warnings = getTransferWarnings(mockTranslate, transferNFT, isOffline(networkUnknown))
    expect(warnings.length).toBe(0)
  })

  it('does not error when correctly formed NFT is provided', () => {
    const warnings = getTransferWarnings(mockTranslate, transferNFT, isOffline(networkUp))
    expect(warnings.length).toBe(0)
  })

  it('catches incomplete form errors: no recipient', async () => {
    const warnings = getTransferWarnings(mockTranslate, transferState, isOffline(networkUp))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches incomplete form errors: no amount', async () => {
    const warnings = getTransferWarnings(mockTranslate, transferState2, isOffline(networkUp))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getTransferWarnings(
      mockTranslate,
      insufficientBalanceState,
      isOffline(networkUp)
    )
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...transferState,
      currencyAmounts: {
        ...transferState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getTransferWarnings(
      mockTranslate,
      incompleteAndInsufficientBalanceState,
      isOffline(networkUp)
    )
    expect(warnings.length).toBe(2)
  })
})
