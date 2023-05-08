import { useEffect, useMemo, useState } from 'react'
import ImageColors from 'react-native-image-colors'
import { IOSImageColors } from 'react-native-image-colors/lib/typescript/types'
import { useAppTheme } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { colors as GlobalColors, GlobalPalette } from 'src/styles/color'
import { theme as FixedTheme, Theme } from 'src/styles/theme'
import { assert } from 'src/utils/validation'
import { hex } from 'wcag-contrast'

export const MIN_COLOR_CONTRAST_THRESHOLD = 3

/**
 * Add opacity information to a hex color
 * @param amount opacity value from 0 to 100
 * @param hexColor
 */
export function opacify(amount: number, hexColor: string): string {
  if (!hexColor.startsWith('#')) {
    return hexColor
  }

  if (hexColor.length !== 7) {
    throw new Error(
      `opacify: provided color ${hexColor} was not in hexadecimal format (e.g. #000000)`
    )
  }

  if (amount < 0 || amount > 100) {
    throw new Error('opacify: provided amount should be between 0 and 100')
  }

  const opacityHex = Math.round((amount / 100) * 255).toString(16)
  const opacifySuffix = opacityHex.length < 2 ? `0${opacityHex}` : opacityHex

  return `${hexColor.slice(0, 7)}${opacifySuffix}`
}

export function getNetworkColorKey(chainId: ChainId): keyof Theme['colors'] {
  return `chain_${chainId}`
}

/** Helper to retrieve foreground and background colors for a given chain */
export function useNetworkColors(chainId: ChainId): { foreground: string; background: string } {
  const theme = useAppTheme()

  const color = theme.colors[getNetworkColorKey(chainId)]

  const foreground = color
  assert(foreground, 'Network color is not defined in Theme')

  return {
    foreground,
    background: opacify(10, foreground),
  }
}

export type ExtractedColors = Pick<
  IOSImageColors,
  'background' | 'detail' | 'secondary' | 'primary'
>

const specialCaseTokenColors: { [key: string]: string } = {
  // WBTC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png':
    '#F09241',

  // DAI
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png':
    '#FAB01B',

  // UNI
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png':
    '#E6358C',

  // BUSD
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4Fabb145d64652a948d72533023f6E7A623C7C53/logo.png':
    '#EFBA09',
}

export function useExtractedColors(
  imageUrl: NullUndefined<string>,
  fallback: keyof Theme['colors'] = 'magentaVibrant',
  cache = true
): { colors: Nullable<ExtractedColors>; colorsLoading: boolean } {
  const [colors, setColors] = useState<Nullable<ExtractedColors>>(null)
  const [colorsLoading, setColorsLoading] = useState(true)

  useEffect(() => {
    if (!imageUrl) return

    setColorsLoading(true)

    ImageColors.getColors(imageUrl, {
      key: imageUrl,
      ...(fallback && { fallback }),
      ...(cache && { cache }),
    }).then((result) => {
      const { background, detail, secondary, primary } = result as IOSImageColors
      setColors({
        background,
        detail,
        secondary,
        primary,
      })
    })
    setColorsLoading(false)
  }, [imageUrl, fallback, cache])

  return { colors, colorsLoading }
}

function getSpecialCaseTokenColor(imageUrl: NullUndefined<string>): Nullable<string> {
  if (!imageUrl || !specialCaseTokenColors[imageUrl]) {
    return null
  }
  return specialCaseTokenColors[imageUrl] ?? null
}
/**
 * Picks a contrast-passing color from a given token image URL and background color.
 * The color extracting library will return a few options, and this function will
 * try to pick the best of those given options.
 *
 * Usage:
 *
 * ```ts
 * const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
 *    tokenImageUrl,
 *    theme.colors.background0,
 *    theme.colors.textTertiary
 * )
 * ```
 *
 * @param imageUrl The URL of the image to extract a color from
 * @param backgroundColor The hex value of the background color to check contrast against
 * @param defaultColor The color that will be returned while the extraction is still loading
 * @returns The extracted color as a hex code string
 */
export function useExtractedTokenColor(
  imageUrl: NullUndefined<string>,
  backgroundColor: string,
  defaultColor: string
): { tokenColor: Nullable<string>; tokenColorLoading: boolean } {
  const { colors, colorsLoading } = useExtractedColors(imageUrl)
  const [tokenColor, setTokenColor] = useState(defaultColor)
  const [tokenColorLoading, setTokenColorLoading] = useState(true)

  useEffect(() => {
    if (!colorsLoading && !!colors) {
      setTokenColor(pickContrastPassingColor(colors, backgroundColor))
      setTokenColorLoading(false)
    }
  }, [backgroundColor, colors, colorsLoading])

  const specialCaseTokenColor = useMemo(() => {
    return getSpecialCaseTokenColor(imageUrl)
  }, [imageUrl])

  if (specialCaseTokenColor) {
    return { tokenColor: specialCaseTokenColor, tokenColorLoading: false }
  }

  if (!imageUrl) {
    return { tokenColor: null, tokenColorLoading: false }
  }

  return { tokenColor, tokenColorLoading }
}

/**
 * Picks a contrast-passing text color to put on top of a given background color.
 * The threshold right now is 3.0, which is the WCAG AA standard.
 * @param backgroundColor The hex value of the background color to check contrast against
 * @returns either 'textOnBrightPrimary' or 'textOnDimPrimary'
 */
export function getContrastPassingTextColor(
  backgroundColor: string
): 'textOnBrightPrimary' | 'textOnDimPrimary' {
  const lightText = FixedTheme.colors.textOnBrightPrimary

  if (hex(lightText, backgroundColor) >= MIN_COLOR_CONTRAST_THRESHOLD) {
    return 'textOnBrightPrimary'
  }
  return 'textOnDimPrimary'
}

export function passesContrast(
  color: string,
  backgroundColor: string,
  contrastThreshold: number
): boolean {
  // sometimes the extracted colors come back as black or white, discard those
  if (color === '#000000' || color === '#FFFFFF') {
    return false
  }

  const contrast = hex(color, backgroundColor)
  return contrast >= contrastThreshold
}

/**
 * Picks a contrast-passing color from a given few that are returned from the color extraction library.
 * The threshold right now is 1.95, which is a little bit less strict than when picking text to go on top
 * of a color, because with the limitations of the color extraction library, a slightly lower threshold
 * leads to better results right now.
 * @param extractedColors An object of `background`, `primary`, `detail`, and `secondary` colors that
 * the color extraction library returns for a given image URL
 * @param backgroundHex The hex value of the background color to check the contrast of the resulting
 * color against
 * @returns a hex code that will pass a contrast check against the background
 */
function pickContrastPassingColor(extractedColors: ExtractedColors, backgroundHex: string): string {
  const contrastThreshold = 1.95

  const { background, detail, secondary, primary } = extractedColors

  // TODO(MOB-3693): Define more robust color extraction logic. Some ideas:
  // - compute all extracted colors and find the highest contrast one (that isn't #000000 or #FFFFFF)
  // - bump color until it passes contrast: e.g. `import { lighten, desaturate } from 'polished'`
  // - locally cache the result with the image logo URL as a key
  // - move this logic to the backend

  if (passesContrast(background, backgroundHex, contrastThreshold)) {
    return background
  }
  if (passesContrast(primary, backgroundHex, contrastThreshold)) {
    return primary
  }
  if (passesContrast(detail, backgroundHex, contrastThreshold)) {
    return detail
  }
  if (passesContrast(secondary, backgroundHex, contrastThreshold)) {
    return secondary
  }

  return FixedTheme.colors.magentaVibrant
}

/**
 * @param uri image uri
 * @returns Extracts background color from image uri and finds closest theme colors.
 * Returns colors as raw hex code strings.
 */
export function useNearestThemeColorFromImageUri(uri: string | undefined): {
  color: string | undefined
  colorDark: string | undefined
  colorLight: string | undefined
} {
  // extract color from image
  const { colors: extractedImageColor } = useExtractedColors(uri)

  // find nearest theme color and convert to darkest version from theme
  return useMemo(() => {
    if (!extractedImageColor?.background) {
      return { color: undefined, colorDark: undefined, colorLight: undefined }
    }
    const color = findNearestThemeColor(extractedImageColor.background)
    const colorDark = adjustColorVariant(color, AdjustmentType.Darken)
    const colorLight = adjustColorVariant(color, AdjustmentType.Lighten)
    return {
      color: color ? GlobalColors[color] : undefined,
      colorDark: colorDark ? GlobalColors[colorDark] : undefined,
      colorLight: colorLight ? GlobalColors[colorLight] : undefined,
    }
  }, [extractedImageColor])
}

export enum AdjustmentType {
  Darken = 'darken',
  Lighten = 'lighten',
}

const ColorVariant = {
  [AdjustmentType.Darken]: '900',
  [AdjustmentType.Lighten]: '200',
}

/**
 * Replaces a GlobalPalette color variant with a dark or lighter version.
 * Example: blue200 -> blue900
 */
export function adjustColorVariant(
  colorName: string | undefined,
  adjustmentType: AdjustmentType
): keyof GlobalPalette | undefined {
  if (!colorName) {
    return undefined
  }
  const newVariantSuffix = ColorVariant[adjustmentType]
  // Check for non-numerical "vibrant" color key
  if (colorName.includes('Vibrant')) {
    const updatedColorKey = colorName.replace('Vibrant', newVariantSuffix)
    // enforce we have a valid theme color
    if (updatedColorKey in GlobalColors) {
      return updatedColorKey as keyof GlobalPalette
    }
  }

  // Check that we arrive at a valid color key from theme with a numbered variant (ignore black/white)
  const matchesColorName = colorName.match(/\d+/g)
  if (!matchesColorName) {
    return undefined
  }

  // Replace hex value and any digits with 900, the darkest color code in theme
  const updatedColorKey = colorName.replace(/\d+/g, newVariantSuffix)
  if (updatedColorKey in GlobalColors) {
    return updatedColorKey as keyof GlobalPalette
  }
  return undefined
}

// Finds closest theme color to a given hex string by comparing rgb values. Returns GlobalPalette color name.
export function findNearestThemeColor(hexString: string): keyof GlobalPalette | undefined {
  return Object.keys(GlobalColors).reduce(
    (closestMatch, currentColorName) => {
      const currentHex = GlobalColors[currentColorName as keyof GlobalPalette]
      const colorDiff = getColorDiffScore(hexString, currentHex)
      if (colorDiff && (!closestMatch.colorDiff || colorDiff < closestMatch.colorDiff)) {
        return { colorDiff, colorName: currentColorName as keyof GlobalPalette }
      }
      return closestMatch
    },
    {
      colorDiff: Infinity,
      colorName: undefined,
    } as {
      colorDiff: number | undefined
      colorName: keyof GlobalPalette | undefined
    }
  ).colorName
}

/**
 * Returns a number representing the difference between two colors. Lower means more similar.
 */
export function getColorDiffScore(
  colorA: string | null,
  colorB: string | null
): number | undefined {
  if (!colorA || !colorB) {
    return undefined
  }
  const a = hexToRGB(colorA)
  const b = hexToRGB(colorB)
  if (!a || !b) {
    return undefined
  }
  // Range 1 -> 442, add one to avoid comparison bugs when result is 0
  return Math.sqrt(Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2)) + 1
}

// Converts a hex string to rgb format.
export function hexToRGB(hexString: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexString)
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}
