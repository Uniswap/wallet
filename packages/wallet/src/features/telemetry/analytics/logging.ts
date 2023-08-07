import { logger } from 'wallet/src/features/logger/logger'
import { UserPropertyValue } from 'wallet/src/features/telemetry/analytics/analytics'
import serializeError from 'wallet/src/utils/serializeError'

interface ErrorLoggers {
  init(err: unknown): void
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue): void
}

export function generateErrorLoggers(fileName: string): ErrorLoggers {
  return {
    init(err: unknown): void {
      logger.error('Error initializing analytics', {
        tags: {
          file: fileName,
          function: 'init',
          error: serializeError(err),
        },
      })
    },
    sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
      if (__DEV__) {
        logger.info(
          'analytics',
          'sendEvent',
          `[analytics(${eventName})]: ${JSON.stringify(eventProperties ?? {})}`
        )
      }
    },
    flushEvents(): void {
      if (__DEV__) {
        logger.info('analytics', 'flushEvents', 'flushing analytics events')
      }
    },
    setUserProperty(property: string, value: UserPropertyValue): void {
      if (__DEV__) {
        logger.info('analytics', 'setUserProperty', `property: ${property}, value: ${value}`)
      }
    },
  }
}
