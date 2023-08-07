import { ApolloLink, createHttpLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RestLink } from 'apollo-link-rest'
import { config } from 'wallet/src/config'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { getOnChainEnsFetch, STUB_ONCHAIN_ENS_ENDPOINT } from 'wallet/src/features/ens/api'
import { logger } from 'wallet/src/features/logger/logger'
import {
  getOnChainBalancesFetch,
  STUB_ONCHAIN_BALANCES_ENDPOINT,
} from 'wallet/src/features/portfolio/api'
import serializeError from 'wallet/src/utils/serializeError'

const REST_API_URL = uniswapUrls.apiBaseUrl

// mapping from endpoint to custom fetcher, when needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENDPOINT_TO_FETCHER: Record<string, (body: any) => Promise<Response>> = {
  [REST_API_URL + STUB_ONCHAIN_BALANCES_ENDPOINT]: getOnChainBalancesFetch,
  [REST_API_URL + STUB_ONCHAIN_ENS_ENDPOINT]: getOnChainEnsFetch,
}
// Handles fetching data from REST APIs
// Responses will be stored in graphql cache
export const getRestLink = (): ApolloLink => {
  // On-chain balances are fetched with ethers.provider
  // When we detect a request to the balances endpoint, we provide a custom fetcher.
  const customFetch: RestLink.CustomFetch = (uri, options) => {
    const customFetcher = ENDPOINT_TO_FETCHER[uri.toString()]

    if (customFetcher) {
      return customFetcher(JSON.parse(options.body?.toString() ?? ''))
    }

    // Otherwise, use regular browser fetch
    return fetch(uri, options)
  }

  return new RestLink({
    customFetch,
    uri: REST_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      Origin: config.uniswapAppUrl,
    },
  })
}

export const getGraphqlHttpLink = (): ApolloLink =>
  createHttpLink({
    uri: uniswapUrls.graphQLUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      // TODO: [MOB-3883] remove once API gateway supports mobile origin URL
      Origin: uniswapUrls.apiBaseUrl,
    },
  })

// Samples error reports to reduce load on backend
// Recurring errors that we must fix should have enough occurrences that we detect them still
const APOLLO_GRAPHQL_ERROR_SAMPLING_RATE = 0.1
const APOLLO_NETWORK_ERROR_SAMPLING_RATE = 0.01
const APOLLO_PERFORMANCE_SAMPLING_RATE = 0.01

export function sample(cb: () => void, rate: number): void {
  if (Math.random() < rate) {
    cb()
  }
}

export function getErrorLink(
  graphqlErrorSamplingRate = APOLLO_GRAPHQL_ERROR_SAMPLING_RATE,
  networkErrorSamplingRate = APOLLO_NETWORK_ERROR_SAMPLING_RATE
): ApolloLink {
  // Log any GraphQL errors or network error that occurred
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        sample(
          () =>
            logger.error('GraphQL error', {
              tags: {
                file: 'data/links',
                function: 'getErrorLink',
                message,
                locations: JSON.stringify(locations),
                path: JSON.stringify(path),
              },
            }),
          graphqlErrorSamplingRate
        )
      })
    }
    if (networkError) {
      sample(
        () =>
          logger.error('Network error', {
            tags: {
              file: 'data/links',
              function: 'getErrorLink',
              error: serializeError(networkError),
            },
          }),
        networkErrorSamplingRate
      )
    }
  })

  return errorLink
}

export function getPerformanceLink(
  sendAnalyticsEvent: (args: Record<string, string>) => void,
  samplingRate = APOLLO_PERFORMANCE_SAMPLING_RATE
): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const startTime = Date.now()

    return forward(operation).map((data) => {
      const duration = (Date.now() - startTime).toString()
      const dataSize = JSON.stringify(data).length.toString()

      sample(
        () =>
          sendAnalyticsEvent({
            dataSize,
            duration,
            operationName: operation.operationName,
          }),
        samplingRate
      )

      return data
    })
  })
}
