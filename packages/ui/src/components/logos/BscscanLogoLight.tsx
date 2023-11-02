import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [BscscanLogoLight, AnimatedBscscanLogoLight] = createIcon({
  name: 'BscscanLogoLight',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 122 122" {...props}>
      <Path
        d="M25.2228 57.583C25.2229 56.9056 25.3568 56.2348 25.6169 55.6093C25.877 54.9837 26.258 54.4157 26.7382 53.9378C27.2184 53.4599 27.7883 53.0816 28.4151 52.8246C29.0419 52.5676 29.7133 52.4369 30.3908 52.44L38.9588 52.468C40.3249 52.468 41.6351 53.0107 42.6011 53.9767C43.5671 54.9427 44.1098 56.2529 44.1098 57.619V90.0191C45.0748 89.7331 46.3098 89.428 47.6688 89.108C48.6103 88.8865 49.4494 88.3535 50.05 87.5953C50.6506 86.8371 50.9776 85.8983 50.9778 84.931V44.744C50.9778 43.3778 51.5204 42.0675 52.4864 41.1014C53.4524 40.1352 54.7626 39.5923 56.1288 39.592H64.7228C66.089 39.5923 67.3992 40.1352 68.3651 41.1014C69.3311 42.0675 69.8738 43.3778 69.8738 44.744V82.044C69.8738 82.044 72.0238 81.174 74.1168 80.29C74.8945 79.9611 75.5582 79.4104 76.025 78.7067C76.4918 78.003 76.7411 77.1775 76.7418 76.333V31.866C76.7418 30.5001 77.2843 29.1901 78.2501 28.2241C79.2159 27.2581 80.5258 26.7153 81.8918 26.715H90.4768C91.842 26.7164 93.1509 27.2596 94.1158 28.2255C95.0808 29.1914 95.6228 30.5008 95.6228 31.866V68.483C103.066 63.089 110.609 56.601 116.595 48.8C117.463 47.6677 118.038 46.338 118.268 44.9295C118.497 43.521 118.375 42.0776 117.911 40.728C115.14 32.7562 110.735 25.4505 104.979 19.2786C99.2225 13.1067 92.241 8.20438 84.4813 4.88543C76.7216 1.56649 68.3544 -0.0960273 59.9153 0.00428347C51.4762 0.104594 43.1509 1.96552 35.4723 5.46797C27.7936 8.97042 20.9307 14.0373 15.3226 20.3443C9.71457 26.6513 5.48488 34.0596 2.90423 42.0951C0.323578 50.1305 -0.551199 58.6163 0.33587 67.0093C1.22294 75.4022 3.85232 83.5176 8.05576 90.836C8.7881 92.0985 9.86553 93.1258 11.1615 93.7972C12.4574 94.4685 13.918 94.7561 15.3718 94.626C16.9958 94.483 19.0178 94.281 21.4218 93.999C22.468 93.88 23.434 93.3803 24.1356 92.5951C24.8373 91.8099 25.2257 90.7941 25.2268 89.741V57.583"
        fill="#12161C"
      />
      <Path
        d="M25.0391 109.544C34.0883 116.127 44.7823 120.079 55.9379 120.961C67.0934 121.844 78.2758 119.623 88.2476 114.545C98.2195 109.467 106.592 101.729 112.439 92.1878C118.286 82.6465 121.38 71.6735 121.378 60.4831C121.378 59.0831 121.313 57.7051 121.22 56.3311C99.057 89.3861 58.1351 104.839 25.0391 109.544Z"
        fill="#F0B90B"
      />
    </Svg>
  ),
  defaultFill: '#12161C',
})
