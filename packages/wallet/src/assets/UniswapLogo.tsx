import { SVGProps } from 'react'
import { iconSize } from 'ui/src/theme/tokens'

// TODO(EXT-139): replace with reusable Icon component
export const UniswapLogo = ({
  height = iconSize.icon36,
  width = iconSize.icon36,
  ...rest
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
SVGProps<any>): JSX.Element => {
  return (
    <svg fill="none" height={height} viewBox="0 0 32 32" width={width} {...rest}>
      <path
        clip-rule="evenodd"
        d="M13.2167 12.3142C13.1627 12.5228 13.0683 12.7187 12.939 12.8908C12.6983 13.2046 12.3798 13.4493 12.0152 13.6004C11.6874 13.7424 11.3402 13.8341 10.9853 13.8726C10.9122 13.8819 10.8366 13.8876 10.7633 13.8932L10.7514 13.8941C10.5266 13.9027 10.3104 13.9833 10.1346 14.1243C9.95869 14.2652 9.83234 14.459 9.77403 14.6772C9.74732 14.7858 9.72747 14.896 9.71458 15.0071C9.69416 15.1747 9.68365 15.3462 9.67227 15.5317C9.66411 15.6649 9.65551 15.8053 9.64248 15.9566C9.56612 16.573 9.38864 17.1723 9.11725 17.7304C9.06179 17.8477 9.00526 17.9614 8.94974 18.073L8.9497 18.0731C8.65212 18.6717 8.38328 19.2125 8.46048 19.9368C8.52089 20.4947 8.80543 20.8687 9.18351 21.2544C9.36308 21.4389 9.60119 21.5965 9.84836 21.7602C10.5401 22.2181 11.3028 22.7231 11.0515 23.9952C10.8459 25.026 9.14453 26.1077 6.75325 26.4855C6.98521 26.4502 6.47427 25.5745 6.41753 25.4772L6.41414 25.4714C6.34823 25.3677 6.28071 25.2655 6.2133 25.1635L6.21324 25.1634C6.01856 24.8689 5.82483 24.5757 5.67357 24.2507C5.27404 23.402 5.0889 22.4202 5.25261 21.4903C5.40091 20.6486 5.95481 19.9763 6.48813 19.3289C6.57506 19.2234 6.66146 19.1185 6.74545 19.0137C7.45875 18.1239 8.20712 16.958 8.37277 15.8029C8.38674 15.7026 8.39921 15.5932 8.41233 15.4781L8.41234 15.478C8.43582 15.272 8.46139 15.0476 8.5014 14.8241C8.56086 14.438 8.68125 14.0639 8.85805 13.716C8.97872 13.4877 9.1376 13.2821 9.32773 13.1081C9.42686 13.0157 9.49226 12.8925 9.51346 12.7583C9.53466 12.6242 9.51043 12.4867 9.44466 12.368L5.63264 5.48057L11.108 12.2682C11.1704 12.3468 11.2492 12.4107 11.3389 12.4554C11.4286 12.5 11.527 12.5242 11.627 12.5264C11.7271 12.5285 11.8264 12.5085 11.9179 12.4678C12.0094 12.4271 12.0909 12.3666 12.1565 12.2907C12.2259 12.2094 12.2652 12.1066 12.2679 11.9996C12.2706 11.8926 12.2364 11.788 12.1712 11.7034C11.9166 11.3766 11.6517 11.0453 11.388 10.7156L11.3879 10.7155L11.3878 10.7154C11.2811 10.582 11.1746 10.4488 11.0691 10.3163L9.6912 8.60323L6.92572 5.18299L3.85498 1.53125L7.28042 4.8766L10.2242 8.14609L11.6927 9.78474C11.8276 9.93729 11.9624 10.0885 12.0973 10.2397L12.0975 10.2399L12.0975 10.2399C12.4498 10.6349 12.8021 11.0298 13.1544 11.4489L13.2343 11.5467L13.2518 11.6985C13.2756 11.9042 13.2637 12.1125 13.2167 12.3142ZM27.289 14.616L27.2948 14.6248L27.2948 14.6224C27.2929 13.8919 26.8427 12.6883 25.9326 11.5305L25.9111 11.5021C25.6305 11.1537 25.3247 10.8265 24.9961 10.5233C24.9853 10.5127 24.9742 10.5021 24.9631 10.4916C24.9755 10.5026 24.9879 10.5135 25.0002 10.524C24.9611 10.4876 24.9212 10.4516 24.8815 10.4158L24.8427 10.3808L24.8053 10.3468C24.8248 10.3646 24.8442 10.3826 24.8636 10.4006L24.8636 10.4007L24.8717 10.4081C24.8484 10.3874 24.8249 10.3667 24.8012 10.3461C24.3803 9.97729 23.9202 9.65623 23.4292 9.38872L23.3941 9.3711C21.8516 8.5273 19.8442 8.09268 17.3692 8.58212C17.0367 8.17672 16.6787 7.79319 16.2973 7.43389C15.7131 6.87473 15.0255 6.43607 14.2733 6.14274C13.5279 5.86863 12.7297 5.77082 11.9405 5.8569C12.7012 5.9257 13.4421 6.13825 14.1243 6.48339C14.783 6.83793 15.3763 7.30346 15.8783 7.8597C16.387 8.4275 16.8652 9.02221 17.3107 9.64128L17.4225 9.78747C17.8585 10.3578 18.3023 10.9385 18.8552 11.4552C19.1596 11.7429 19.4991 11.9906 19.8657 12.1923C19.9631 12.2422 20.0615 12.2892 20.158 12.3303C20.2545 12.3714 20.3451 12.4096 20.4425 12.4448C20.6306 12.5182 20.8255 12.5789 21.0204 12.6347C21.7999 12.8579 22.598 12.9382 23.3776 12.9812C23.4861 12.987 23.5944 12.9923 23.7023 12.9977L23.7023 12.9977C23.9808 13.0115 24.2566 13.0251 24.5284 13.0449C24.9008 13.0671 25.2702 13.1254 25.6315 13.2191C26.1741 13.3612 26.6519 13.686 26.985 14.1393C27.0982 14.2902 27.1998 14.4496 27.289 14.616ZM24.0489 17.7352C21.542 16.7133 18.9197 15.6444 19.3102 12.6443C20.1471 13.5421 21.461 13.7303 22.89 13.9351C24.1862 14.1208 25.5772 14.3202 26.7929 15.0749C29.6617 16.8545 29.2427 20.3119 28.2683 21.5845C28.3561 19.4909 26.2469 18.6312 24.0489 17.7352ZM13.9316 16.233C14.5932 16.1694 16.0033 15.8239 15.3728 14.7089C15.2372 14.4821 15.0406 14.2983 14.8056 14.1787C14.5707 14.059 14.3069 14.0084 14.0446 14.0325C13.7784 14.0612 13.5275 14.1715 13.3258 14.3483C13.1241 14.5252 12.9815 14.7601 12.9172 15.0212C12.7214 15.7505 12.9289 16.3309 13.9316 16.233ZM13.7573 7.40928C13.3422 6.92767 12.6981 6.67511 12.0666 6.5831C12.043 6.74106 12.028 6.9002 12.0218 7.05981C11.9935 8.37446 12.4584 9.81832 13.3578 10.8217C13.6455 11.146 13.9925 11.4119 14.38 11.6048C14.6041 11.7144 15.1985 11.9866 15.4187 11.7418C15.4355 11.7194 15.446 11.6929 15.4493 11.6651C15.4525 11.6372 15.4484 11.609 15.4372 11.5833C15.4007 11.4785 15.3302 11.3834 15.2602 11.289C15.2106 11.222 15.1612 11.1554 15.1244 11.086C15.0872 11.016 15.0475 10.9478 15.0077 10.8797L15.0077 10.8796L15.0077 10.8796L15.0076 10.8795L15.0076 10.8795L15.0076 10.8794L15.0076 10.8794C14.9328 10.7512 14.8581 10.6232 14.8009 10.484C14.6499 10.1195 14.5713 9.73184 14.4929 9.34546C14.4772 9.26803 14.4615 9.19066 14.4452 9.11352C14.3254 8.51738 14.1724 7.89089 13.7573 7.40928ZM22.6269 17.8975C21.9829 19.7027 23.0215 21.2275 24.054 22.7432C25.2089 24.4387 26.3561 26.1229 25.1322 28.1758C27.5108 27.1891 28.6402 24.2084 27.6531 21.8434C27.031 20.3475 25.5319 19.5366 24.1404 18.7839C23.6005 18.4919 23.0768 18.2086 22.6269 17.8975ZM15.6531 22.2074C15.222 22.3841 14.8156 22.6161 14.4438 22.8975C15.2891 22.5896 16.1764 22.4136 17.0748 22.3758C17.2376 22.3661 17.4015 22.3585 17.5668 22.3509L17.5669 22.3509L17.5671 22.3509L17.5672 22.3509L17.5673 22.3509L17.5674 22.3508L17.5675 22.3508L17.5676 22.3508C17.8531 22.3376 18.1429 22.3242 18.439 22.2994C18.9246 22.2664 19.4034 22.1676 19.8627 22.0058C20.3439 21.8366 20.7818 21.5625 21.145 21.2031C21.5119 20.8321 21.7693 20.3662 21.8885 19.8571C21.9934 19.3762 21.9787 18.8767 21.8456 18.4029C21.7125 17.9291 21.4652 17.4956 21.1255 17.1407C21.2894 17.5582 21.3903 17.9981 21.4247 18.4456C21.4544 18.8622 21.398 19.2804 21.259 19.6741C21.1234 20.0471 20.9017 20.3826 20.612 20.6529C20.3128 20.9259 19.9663 21.1415 19.5898 21.2892C19.0665 21.501 18.4748 21.5876 17.8584 21.6779L17.8583 21.6779C17.5771 21.7191 17.2909 21.761 17.0036 21.8159C16.5416 21.9009 16.0892 22.0321 15.6531 22.2074ZM23.1723 29.6225C23.1434 29.6456 23.1145 29.669 23.0854 29.6925C22.9765 29.7806 22.8657 29.8701 22.7465 29.9505C22.5945 30.0511 22.4352 30.1401 22.27 30.2167C21.926 30.3853 21.5477 30.4714 21.165 30.4683C20.1282 30.4487 19.3954 29.6735 18.9666 28.7973C18.8542 28.5677 18.7552 28.331 18.6562 28.0942C18.4977 27.7154 18.3392 27.3364 18.1257 26.9864C17.6297 26.1729 16.781 25.5181 15.787 25.6395C15.3817 25.6904 15.0016 25.8734 14.7765 26.2268C14.1841 27.1499 15.0348 28.443 16.1193 28.2599C16.2116 28.2458 16.3018 28.2209 16.3883 28.1855C16.4744 28.1487 16.5548 28.0996 16.627 28.0397C16.7785 27.913 16.8927 27.7471 16.9573 27.56C17.0286 27.3649 17.0444 27.1538 17.0031 26.9502C16.9586 26.7374 16.8335 26.5503 16.6543 26.4284C16.8627 26.5265 17.0251 26.7019 17.1074 26.9179C17.1927 27.1401 17.2146 27.3818 17.1707 27.6158C17.1282 27.8597 17.0211 28.0875 16.8609 28.2756C16.7757 28.3723 16.6773 28.4564 16.5685 28.5252C16.4607 28.5932 16.3453 28.6481 16.2245 28.6887C15.9798 28.7727 15.7192 28.7998 15.4625 28.768C15.1021 28.7164 14.7621 28.5683 14.4783 28.3392C14.4213 28.2939 14.3667 28.2462 14.314 28.1968C14.1273 28.0334 13.9574 27.8514 13.8071 27.6534C13.7368 27.5756 13.6653 27.4988 13.5906 27.4249C13.2432 27.0588 12.8333 26.7581 12.3804 26.5371C12.068 26.3993 11.7411 26.2975 11.4059 26.2336C11.2373 26.1984 11.0668 26.173 10.8963 26.1514C10.8778 26.1496 10.842 26.1433 10.7976 26.1356L10.7976 26.1356C10.6552 26.1107 10.4236 26.0703 10.3828 26.1083C10.9098 25.6209 11.4844 25.188 12.0978 24.8162C12.7276 24.4408 13.4038 24.1502 14.109 23.9519C14.8402 23.7451 15.605 23.6862 16.359 23.7786C16.7472 23.8254 17.1273 23.9242 17.4894 24.0723C17.8687 24.2245 18.2189 24.4418 18.5242 24.7144C18.8264 25.0004 19.0706 25.3424 19.2434 25.7217C19.3993 26.0767 19.5157 26.448 19.5903 26.8288C19.6303 27.0337 19.6604 27.2589 19.6916 27.4919C19.8337 28.5538 19.9977 29.779 21.2147 29.9926C21.292 30.0076 21.3701 30.0187 21.4485 30.0259L21.6912 30.0317C21.858 30.0198 22.0237 29.9959 22.1872 29.9603C22.5257 29.8803 22.8557 29.7672 23.1723 29.6225Z"
        fill="currentColor"
        fill-rule="evenodd"
      />
    </svg>
  )
}
