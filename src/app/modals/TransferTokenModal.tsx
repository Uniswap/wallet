import React from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { TransferFlow } from 'src/features/transactions/transfer/TransferFlow'

export function TransferTokenModal(): JSX.Element {
  const theme = useAppTheme()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Send))

  const onClose = (): void => {
    appDispatch(closeModal({ name: ModalName.Send }))
  }

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={theme.colors.background1}
      name={ModalName.Send}
      onClose={onClose}>
      <TransferFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
