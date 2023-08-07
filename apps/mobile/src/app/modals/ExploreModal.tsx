import React from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { ExploreStackNavigator } from 'src/app/navigation/navigation'
import { ExploreStackParamList } from 'src/app/navigation/types'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'

type InnerExploreStackParamList = Omit<ExploreStackParamList, Screens.Explore>

// The ExploreModalState allows a Screen and its Params to be defined, except for the initial Explore screen.
// This workaround facilitates navigation to any screen within the ExploreStack from outside.
// Implementation of this lives inside screens/ExploreScreen
export type ExploreModalState = {
  [V in keyof InnerExploreStackParamList]: { screen: V; params: InnerExploreStackParamList[V] }
}[keyof InnerExploreStackParamList]

export function ExploreModal(): JSX.Element {
  const theme = useAppTheme()
  const appDispatch = useAppDispatch()

  const onClose = (): void => {
    appDispatch(closeModal({ name: ModalName.Explore }))
  }

  return (
    <BottomSheetModal
      blurredBackground
      fullScreen
      hideKeyboardOnDismiss
      backgroundColor={theme.colors.none}
      hideHandlebar={true}
      name={ModalName.Explore}
      renderBehindInset={true}
      onClose={onClose}>
      <ExploreStackNavigator />
    </BottomSheetModal>
  )
}
