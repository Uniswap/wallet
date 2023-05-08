import React from 'react'
import { useTranslation } from 'react-i18next'
import PasteIcon from 'src/assets/icons/paste.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { getClipboard } from 'src/utils/clipboard'

export default function PasteButton({
  onPress,
  beforePress,
  afterClipboardReceived,
}: {
  onPress: (text: string) => void
  beforePress?: () => void
  afterClipboardReceived?: () => void
}): JSX.Element {
  const onPressButton = async (): Promise<void> => {
    const clipboard = await getClipboard()
    // Since paste may trigger OS permission modal, the following callback is used to control other behavior such as blocking views that need to be shown/hidden.
    afterClipboardReceived?.()
    if (clipboard) {
      onPress(clipboard)
    }
  }
  const { t } = useTranslation()

  return (
    <Button
      IconName={PasteIcon}
      emphasis={ButtonEmphasis.Secondary}
      label={t('Paste')}
      size={ButtonSize.Small}
      onPress={onPressButton}
      onPressIn={beforePress}
    />
  )
}
