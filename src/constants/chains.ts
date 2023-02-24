// Based on https://github.com/Uniswap/interface/blob/main/src/constants/chains.ts

import { ImageSourcePropType } from 'react-native'
import {
  ARBITRUM_LOGO,
  ETHEREUM_LOGO,
  GOERLI_LOGO,
  MUMBAI_LOGO,
  OPTIMISM_LOGO,
  POLYGON_LOGO,
} from 'src/assets'

export type ChainIdTo<T> = Partial<Record<ChainId, T>>
export type ChainIdToCurrencyIdTo<T> = ChainIdTo<{ [currencyId: string]: T }>

// Renamed from SupportedChainId in web app
export enum ChainId {
  Mainnet = 1,
  Goerli = 5,

  ArbitrumOne = 42161,
  Optimism = 10,
  Polygon = 137,
  PolygonMumbai = 80001,
}

// DON'T CHANGE - order here determines ordering of networks in app
// TODO: [MOB-3882] Add back in testnets once our endpoints support them
export const ALL_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.Mainnet,
  ChainId.Polygon,
  ChainId.ArbitrumOne,
  ChainId.Optimism,
  // ChainId.Goerli,
  // ChainId.PolygonMumbai,
]

export const TESTNET_CHAIN_IDS = [ChainId.Goerli, ChainId.PolygonMumbai]

export const L1_CHAIN_IDS = [ChainId.Mainnet, ChainId.Goerli] as const

// Renamed from SupportedL1ChainId in web app
export type L1ChainId = typeof L1_CHAIN_IDS[number]

export const L2_CHAIN_IDS = [
  ChainId.ArbitrumOne,
  ChainId.Optimism,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
] as const

// Renamed from SupportedL2ChainId in web app
export type L2ChainId = typeof L2_CHAIN_IDS[number]

export const isL2Chain = (chainId?: ChainId): boolean =>
  Boolean(chainId && L2_CHAIN_IDS.includes(chainId as L2ChainId))

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly bridge?: string
  readonly docs: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly logoUrl?: string
  readonly logo?: ImageSourcePropType
  readonly rpcUrls?: string[]
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number //18,
  }
}
export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly statusPage?: string
}

export type ChainInfo = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo } & {
  readonly [chainId in L2ChainId]: L2ChainInfo
} & { readonly [chainId in L1ChainId]: L1ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [ChainId.ArbitrumOne]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: 'Arbitrum',
    logo: ARBITRUM_LOGO,
    nativeCurrency: { name: 'Arbitrum ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  },
  [ChainId.Mainnet]: {
    blockWaitMsBeforeWarning: 60000, // 1 minute
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    logo: ETHEREUM_LOGO,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  [ChainId.Goerli]: {
    blockWaitMsBeforeWarning: 180000, // 3 minutes
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Görli',
    logo: GOERLI_LOGO,
    nativeCurrency: { name: 'Görli ETH', symbol: 'görETH', decimals: 18 },
  },
  [ChainId.Optimism]: {
    blockWaitMsBeforeWarning: 1200000, // 20 minutes
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'Optimism',
    logo: OPTIMISM_LOGO,
    nativeCurrency: { name: 'Optimistic ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    statusPage: 'https://optimism.io/status',
  },
  [ChainId.Polygon]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon',
    logo: POLYGON_LOGO,
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com/'],
  },
  [ChainId.PolygonMumbai]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon Mumbai',
    logo: MUMBAI_LOGO,
    nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
    rpcUrls: ['https://rpc-endpoints.superfluid.dev/mumbai'],
  },
}

export function isPolygonChain(
  chainId: number
): chainId is ChainId.Polygon | ChainId.PolygonMumbai {
  return chainId === ChainId.PolygonMumbai || chainId === ChainId.Polygon
}

export const CHAIN_ID_TO_LOGO: Record<ChainId, ImageSourcePropType> = {
  [ChainId.Mainnet]: ETHEREUM_LOGO,
  [ChainId.Goerli]: ETHEREUM_LOGO,
  [ChainId.Optimism]: ETHEREUM_LOGO,
  [ChainId.ArbitrumOne]: ETHEREUM_LOGO,
  [ChainId.Polygon]: POLYGON_LOGO,
  [ChainId.PolygonMumbai]: POLYGON_LOGO,
}
