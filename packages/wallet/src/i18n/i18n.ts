import i18n, { TFunction } from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'

export const resources = {
  en: {
    translation: en,
  },
}

export const defaultNS = 'translation'

i18n
  .use(initReactI18next)
  .init({
    defaultNS,
    lng: 'en',
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })
  .catch(() => undefined)

/*
type DefaultLocale = typeof en
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>

// via: https://stackoverflow.com/a/65333050
type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `${TKey}`
  >
}[keyof TObj & (string | number)]

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `['${TKey}']` | `.${TKey}`
  >
}[keyof TObj & (string | number)]

type RecursiveKeyOfHandleValue<
  TValue,
  Text extends string
> = TValue extends any[]
  ? Text
  : TValue extends object
  ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
  : Text
export const t = (key: TxKeyPath) => (key ? i18n.t(key) : undefined)
*/

export const changeLanguage = async (str: string): Promise<TFunction> => {
  return await i18n.changeLanguage(str)
}

export default i18n
