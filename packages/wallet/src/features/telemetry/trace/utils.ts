import React from 'react'
import { NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import { analytics } from 'wallet/src/features/telemetry/analytics/analytics'
import { ITraceContext } from 'wallet/src/features/telemetry/trace/TraceContext'

const EVENTS_HANDLED = ['onPress']

/**
 * Given a set of child element and action props, returns a spreadable
 * object of the event handlers augmented with telemetry logging.
 */
export function getEventHandlers(
  child: React.ReactElement,
  consumedProps: ITraceContext,
  eventName: string,
  element?: string,
  properties?: Record<string, unknown>
): Partial<Record<string, (e: NativeSyntheticEvent<NativeTouchEvent>) => void>> {
  const eventHandlers: Partial<
    Record<string, (e: NativeSyntheticEvent<NativeTouchEvent>) => void>
  > = {}
  for (const event of EVENTS_HANDLED) {
    eventHandlers[event] = (eventHandlerArgs: unknown): void => {
      // call child event handler with original arguments
      child.props[event].apply(child, [eventHandlerArgs])

      // augment handler with analytics logging
      analytics.sendEvent(eventName, {
        element,
        ...consumedProps,
        ...properties,
      })
    }
  }

  // return a spreadable event handler object
  return eventHandlers
}
