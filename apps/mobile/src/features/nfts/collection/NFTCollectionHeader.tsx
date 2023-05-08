import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageStyle } from 'react-native-fast-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import EthereumLogo from 'src/assets/logos/ethereum.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { ImageUri } from 'src/components/images/ImageUri'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { NftCollectionScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { NFTCollectionContextMenu } from 'src/features/nfts/collection/NFTCollectionContextMenu'
import { iconSizes } from 'src/styles/sizing'
import { theme as FixedTheme } from 'src/styles/theme'
import { useExtractedColors } from 'src/utils/colors'
import { formatNumber, NumberType } from 'src/utils/format'

const PROFILE_IMAGE_SIZE = 72
const PROFILE_IMAGE_WRAPPER_SIZE = PROFILE_IMAGE_SIZE + FixedTheme.spacing.spacing4
export const NFT_BANNER_HEIGHT = 102

export type NFTCollectionData = NullUndefined<
  NonNullable<NonNullable<NftCollectionScreenQuery['nftCollections']>['edges']>[0]['node']
>

export function NFTCollectionHeader({
  loading = false,
  data,
  collectionAddress,
}: {
  loading: boolean
  data: NullUndefined<NFTCollectionData>
  collectionAddress?: NullUndefined<string>
}): ReactElement {
  const theme = useAppTheme()
  const { t } = useTranslation()

  // Style based on device sizing
  const { top: deviceTopPadding } = useSafeAreaInsets()
  const adjustedBannerHeight = deviceTopPadding + NFT_BANNER_HEIGHT

  const bannerImageStyle: ImageStyle = {
    height: adjustedBannerHeight,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: adjustedBannerHeight,
  }

  const bannerLoadingStyle: BoxProps['style'] = {
    ...bannerImageStyle,
    overflow: 'hidden',
  }

  const profileImageWrapperStyle: ImageStyle = {
    position: 'absolute',
    left: 0,
    top: adjustedBannerHeight - PROFILE_IMAGE_WRAPPER_SIZE / 2,
  }

  const collectionStats = data?.markets?.[0]
  const bannerImageUrl = data?.bannerImage?.url
  const profileImageUrl = data?.image?.url

  // Extract profile image color as a fallback background color if no banner image.
  const { colors: bannerColorsFallback } = useExtractedColors(profileImageUrl, 'background2')

  return (
    <>
      <Flex gap="spacing12" mb="spacing16" pb="spacing4">
        {/* Banner image*/}
        {loading || !!bannerImageUrl ? (
          <ImageUri
            imageStyle={bannerImageStyle}
            loadingContainerStyle={bannerLoadingStyle}
            maxHeight={adjustedBannerHeight}
            resizeMode="cover"
            uri={data?.bannerImage?.url}
          />
        ) : (
          // No uri found on collection
          <Box
            style={[
              bannerImageStyle,
              { backgroundColor: bannerColorsFallback?.background ?? theme.colors.background2 },
            ]}
          />
        )}

        {/* Banner buttons */}
        <Flex row alignItems="center" justifyContent="space-between" mx="spacing24" pt="spacing48">
          <TouchableArea
            hapticFeedback
            backgroundColor="textOnDimTertiary"
            borderRadius="roundedFull"
            padding="spacing12">
            <Flex centered grow height={theme.iconSizes.icon8} width={theme.iconSizes.icon8}>
              <BackButton color="white" size={theme.iconSizes.icon24} />
            </Flex>
          </TouchableArea>
          <NFTCollectionContextMenu
            collectionAddress={collectionAddress}
            data={data}
            iconColor="white"
            showButtonOutline={true}
          />
        </Flex>

        {/* Profile image */}
        <Flex gap="none" px="spacing24" style={profileImageWrapperStyle}>
          <Flex
            alignItems="center"
            bg="background0"
            borderRadius="roundedFull"
            height={PROFILE_IMAGE_WRAPPER_SIZE}
            justifyContent="center"
            width={PROFILE_IMAGE_WRAPPER_SIZE}>
            {data?.image?.url ? (
              <Box
                height={PROFILE_IMAGE_SIZE}
                overflow="hidden"
                style={{ borderRadius: PROFILE_IMAGE_SIZE }}
                width={PROFILE_IMAGE_SIZE}>
                <NFTViewer uri={data.image.url} />
              </Box>
            ) : (
              <Box
                backgroundColor="background2"
                borderRadius="roundedFull"
                height={PROFILE_IMAGE_SIZE}
                width={PROFILE_IMAGE_SIZE}
              />
            )}
          </Flex>
        </Flex>

        {/* Collection stats */}
        <Flex
          gap="spacing4"
          pt="spacing12"
          px="spacing24"
          style={{ marginTop: PROFILE_IMAGE_WRAPPER_SIZE }}>
          <Flex row alignItems="center" gap="spacing8">
            <Text loading={loading} loadingPlaceholderText="Collection Name" variant="subheadLarge">
              {data?.name ?? '-'}
            </Text>
            {data?.isVerified ? (
              <VerifiedIcon
                color={theme.colors.userThemeMagenta}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            ) : null}
          </Flex>

          <Flex row gap="spacing24" justifyContent="space-between">
            <Flex fill alignItems="flex-start" gap="spacing4">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Items')}
              </Text>
              <Text loading={loading} variant="bodyLarge">
                {formatNumber(data?.numAssets, NumberType.NFTCollectionStats)}
              </Text>
            </Flex>
            <Flex fill alignItems="flex-start" gap="spacing4">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Owners')}
              </Text>
              <Text loading={loading} variant="bodyLarge">
                {formatNumber(collectionStats?.owners, NumberType.NFTCollectionStats)}
              </Text>
            </Flex>
            <Flex fill alignItems="flex-start" gap="spacing4">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Floor')}
              </Text>
              <Flex row alignItems="center" gap="none">
                <Text loading={loading} variant="bodyLarge">
                  {`${formatNumber(
                    collectionStats?.floorPrice?.value,
                    NumberType.NFTTokenFloorPrice
                  )} `}
                </Text>
                {collectionStats?.floorPrice?.value !== undefined ? (
                  <EthereumLogo color={theme.colors.textPrimary} />
                ) : null}
              </Flex>
            </Flex>
            <Flex fill alignItems="flex-start" gap="spacing4">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Volume')}
              </Text>
              <Flex row alignItems="center" gap="spacing4">
                <Text loading={loading} pr="spacing1" variant="bodyLarge">
                  {`${formatNumber(
                    collectionStats?.totalVolume?.value,
                    NumberType.NFTCollectionStats
                  )}`}
                </Text>
                {collectionStats?.totalVolume?.value !== undefined ? (
                  <EthereumLogo color={theme.colors.textPrimary} />
                ) : null}
              </Flex>
            </Flex>
          </Flex>

          {/* Collection description */}
          {data?.description ? (
            <LongText
              gap="none"
              initialDisplayedLines={3}
              lineBreakMode="tail"
              mt="spacing4"
              readMoreOrLessColor={theme.colors.textTertiary}
              renderAsMarkdown={true}
              text={data?.description}
            />
          ) : loading ? (
            <Flex gap="spacing8">
              <Loader.Box height={theme.spacing.spacing16} width="100%" />
              <Loader.Box height={theme.spacing.spacing16} width="100%" />
              <Loader.Box height={theme.spacing.spacing16} width="100%" />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </>
  )
}
