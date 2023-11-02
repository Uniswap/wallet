import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageStyle } from 'react-native-fast-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackButton } from 'src/components/buttons/BackButton'
import { Loader } from 'src/components/loading'
import { LongText } from 'src/components/text/LongText'
import { NFTCollectionContextMenu } from 'src/features/nfts/collection/NFTCollectionContextMenu'
import { Flex, FlexProps, Logos, Text, TouchableArea, useSporeColors } from 'ui/src'
import VerifiedIcon from 'ui/src/assets/icons/verified.svg'
import { iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'
import { useExtractedColors } from 'wallet/src/utils/colors'
import { NFTCollectionData } from './types'

const PROFILE_IMAGE_SIZE = 72
const PROFILE_IMAGE_WRAPPER_SIZE = PROFILE_IMAGE_SIZE + spacing.spacing4
export const NFT_BANNER_HEIGHT = 102

export function NFTCollectionHeader({
  loading = false,
  data,
  collectionAddress,
}: {
  loading: boolean
  data: Maybe<NFTCollectionData>
  collectionAddress?: Maybe<string>
}): ReactElement {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizedFormatter()

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

  const bannerLoadingStyle: FlexProps['style'] = {
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
  const { colors: bannerColorsFallback } = useExtractedColors(profileImageUrl, 'surface2')

  return (
    <>
      <Flex gap="$spacing12" mb="$spacing16" pb="$spacing4">
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
          <Flex
            style={[
              bannerImageStyle,
              { backgroundColor: bannerColorsFallback?.base ?? colors.surface2.get() },
            ]}
          />
        )}

        {/* Banner buttons */}
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          mx="$spacing24"
          pt="$spacing48">
          <TouchableArea
            hapticFeedback
            backgroundColor="$sporeBlack"
            borderRadius="$roundedFull"
            p="$spacing12">
            <Flex centered grow height={iconSizes.icon8} width={iconSizes.icon8}>
              <BackButton color="$sporeWhite" size={iconSizes.icon24} />
            </Flex>
          </TouchableArea>
          <NFTCollectionContextMenu
            collectionAddress={collectionAddress}
            data={data}
            iconColor="$sporeWhite"
            showButtonOutline={true}
          />
        </Flex>

        {/* Profile image */}
        <Flex px="$spacing24" style={profileImageWrapperStyle}>
          <Flex
            alignItems="center"
            bg="$surface1"
            borderRadius="$roundedFull"
            height={PROFILE_IMAGE_WRAPPER_SIZE}
            justifyContent="center"
            width={PROFILE_IMAGE_WRAPPER_SIZE}>
            {data?.image?.url ? (
              <Flex
                height={PROFILE_IMAGE_SIZE}
                overflow="hidden"
                style={{ borderRadius: PROFILE_IMAGE_SIZE }}
                width={PROFILE_IMAGE_SIZE}>
                <NFTViewer uri={data.image.url} />
              </Flex>
            ) : (
              <Flex
                backgroundColor="$surface2"
                borderRadius="$roundedFull"
                height={PROFILE_IMAGE_SIZE}
                width={PROFILE_IMAGE_SIZE}
              />
            )}
          </Flex>
        </Flex>

        {/* Collection stats */}
        <Flex
          gap="$spacing12"
          pt="$spacing12"
          px="$spacing24"
          style={{ marginTop: PROFILE_IMAGE_WRAPPER_SIZE }}>
          <Flex row alignItems="center" gap="$spacing8">
            <Text
              loading={loading}
              loadingPlaceholderText="Collection Name"
              mt="$spacing16"
              variant="subheading1">
              {data?.name ?? '-'}
            </Text>
            {data?.isVerified ? (
              <VerifiedIcon
                color={colors.accent1.get()}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            ) : null}
          </Flex>

          <Flex row gap="$spacing24" justifyContent="space-between">
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" variant="subheading2">
                {t('Items')}
              </Text>
              <Text loading={loading} variant="body1">
                {formatNumberOrString({
                  value: data?.numAssets,
                  type: NumberType.NFTCollectionStats,
                })}
              </Text>
            </Flex>
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" variant="subheading2">
                {t('Owners')}
              </Text>
              <Text loading={loading} variant="body1">
                {formatNumberOrString({
                  value: collectionStats?.owners,
                  type: NumberType.NFTCollectionStats,
                })}
              </Text>
            </Flex>
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" variant="subheading2">
                {t('Floor')}
              </Text>
              <Flex row alignItems="center">
                <Text loading={loading} variant="body1">
                  {`${formatNumberOrString({
                    value: collectionStats?.floorPrice?.value,
                    type: NumberType.NFTTokenFloorPrice,
                  })} `}
                </Text>
                {collectionStats?.floorPrice?.value !== undefined ? (
                  <Logos.Ethereum color="$neutral1" size="$icon.16" />
                ) : null}
              </Flex>
            </Flex>
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" variant="subheading2">
                {t('Volume')}
              </Text>
              <Flex row alignItems="center" gap="$spacing4">
                <Text loading={loading} pr="$spacing1" variant="body1">
                  {`${formatNumberOrString({
                    value: collectionStats?.totalVolume?.value,
                    type: NumberType.NFTCollectionStats,
                  })}`}
                </Text>
                {collectionStats?.totalVolume?.value !== undefined ? (
                  <Logos.Ethereum color="$neutral1" size="$icon.16" />
                ) : null}
              </Flex>
            </Flex>
          </Flex>

          {/* Collection description */}
          {data?.description ? (
            <LongText
              initialDisplayedLines={3}
              lineBreakMode="tail"
              mt="$spacing4"
              renderAsMarkdown={true}
              text={data?.description}
            />
          ) : loading ? (
            <Flex gap="$spacing8">
              <Loader.Box height={spacing.spacing16} width="100%" />
              <Loader.Box height={spacing.spacing16} width="100%" />
              <Loader.Box height={spacing.spacing16} width="100%" />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </>
  )
}
