import { CompositeNavigationProp, RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { SeedPhraseInputScreen } from 'src/screens/Import/SeedPhraseInputScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { render } from 'src/test/test-utils'

jest.mock('src/utils/useAddBackButton', () => ({
  useAddBackButton: (): jest.Mock => jest.fn(),
}))

const navigationProp = {} as CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, OnboardingScreens.ImportMethod, undefined>,
  NativeStackNavigationProp<AppStackParamList, Screens.OnboardingStack, undefined>
>

const routeProp = {} as RouteProp<OnboardingStackParamList, OnboardingScreens.ImportMethod>

describe(SeedPhraseInputScreen, () => {
  it('seed phrase initial screen rendering', async () => {
    const tree = render(<SeedPhraseInputScreen navigation={navigationProp} route={routeProp} />)

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
