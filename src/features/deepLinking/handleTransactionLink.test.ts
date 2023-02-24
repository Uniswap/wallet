import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { Screens } from 'src/screens/Screens'

describe(handleTransactionLink, () => {
  it('Navigates to the notification screen', () => {
    return expectSaga(handleTransactionLink)
      .provide([[call(navigate, Screens.Notifications), undefined]])
      .silentRun()
  })
})
