import * as React from "react";

import { IconSvgProps } from "@/types";

export const Logo: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => (
  <svg fill="none" height={size || height} viewBox="0 0 32 32" width={size || width} {...props}>
    <path
      clipRule="evenodd"
      d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const DiscordIcon: React.FC<IconSvgProps> = ({ size = 24, width, height, ...props }) => {
  return (
    <svg height={size || height} viewBox="0 0 24 24" width={size || width} {...props}>
      <path
        d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1 14.66 14.66 0 0 0-4.58 0 10.14 10.14 0 0 0-.53-1.1 16 16 0 0 0-4.13 1.3 17.33 17.33 0 0 0-3 11.59 16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83 3.39 3.39 0 0 0 .42-.33 11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84 12.41 12.41 0 0 0 1.08 1.78 16.44 16.44 0 0 0 5.06-2.59 17.22 17.22 0 0 0-3-11.59 16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.93 1.93 0 0 1 1.8 2 1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.92 1.92 0 0 1 1.8 2 1.92 1.92 0 0 1-1.8 2z"
        fill="currentColor"
      />
    </svg>
  );
};

export const TwitterIcon: React.FC<IconSvgProps> = ({ size = 24, width, height, ...props }) => {
  return (
    <svg height={size || height} viewBox="0 0 24 24" width={size || width} {...props}>
      <path
        d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GithubIcon: React.FC<IconSvgProps> = ({ size = 24, width, height, ...props }) => {
  return (
    <svg height={size || height} viewBox="0 0 24 24" width={size || width} {...props}>
      <path
        clipRule="evenodd"
        d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const MoonFilledIcon = ({ size = 24, width, height, ...props }: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
      fill="currentColor"
    />
  </svg>
);

export const SunFilledIcon = ({ size = 24, width, height, ...props }: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <g fill="currentColor">
      <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
      <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
    </g>
  </svg>
);

export const HeartFilledIcon = ({ size = 24, width, height, ...props }: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
);

export const SearchIcon = (props: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const PlayFillIcon: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 16.2891 16.416"
    width={size || width}
    {...props}
  >
    <defs>
      <linearGradient id="play-gradient" gradientUnits="userSpaceOnUse" x1="5" x2="5" y2="16.4062">
        <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
        <stop offset="1" stopColor="currentColor" />
      </linearGradient>
    </defs>
    <g>
      <rect height="16.416" opacity="0" width="16.2891" x="0" y="0" />
      <path
        d="M1.70898 14.9805C1.70898 15.9473 2.26562 16.4062 2.92969 16.4062C3.22266 16.4062 3.52539 16.3086 3.82812 16.1523L15.2051 9.50195C16.0156 9.0332 16.2891 8.71094 16.2891 8.20312C16.2891 7.68555 16.0156 7.37305 15.2051 6.9043L3.82812 0.253906C3.52539 0.0878906 3.22266 0 2.92969 0C2.26562 0 1.70898 0.458984 1.70898 1.42578Z"
        fill="url(#play-gradient)"
      />
    </g>
  </svg>
);

export const PauseFillIcon: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 12.2754 16.1621"
    width={size || width}
    {...props}
  >
    <defs>
      <linearGradient id="pause-gradient" gradientUnits="userSpaceOnUse" x1="5" x2="5" y2="16.1523">
        <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
        <stop offset="1" stopColor="currentColor" />
      </linearGradient>
    </defs>
    <g>
      <rect height="16.1621" opacity="0" width="12.2754" x="0" y="0" />
      <path
        d="M1.29883 16.1523L3.52539 16.1523C4.375 16.1523 4.82422 15.7031 4.82422 14.8438L4.82422 1.29883C4.82422 0.400391 4.375 0 3.52539 0L1.29883 0C0.449219 0 0 0.439453 0 1.29883L0 14.8438C0 15.7031 0.449219 16.1523 1.29883 16.1523ZM8.39844 16.1523L10.6152 16.1523C11.4746 16.1523 11.9141 15.7031 11.9141 14.8438L11.9141 1.29883C11.9141 0.400391 11.4746 0 10.6152 0L8.39844 0C7.53906 0 7.08984 0.439453 7.08984 1.29883L7.08984 14.8438C7.08984 15.7031 7.53906 16.1523 8.39844 16.1523Z"
        fill="url(#pause-gradient)"
      />
    </g>
  </svg>
);

export const ForwardFillIcon: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 28.252 14.9316"
    width={size || width}
    {...props}
  >
    <defs>
      <linearGradient
        id="forward-gradient"
        gradientUnits="userSpaceOnUse"
        x1="5"
        x2="5"
        y2="14.9219"
      >
        <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
        <stop offset="1" stopColor="currentColor" />
      </linearGradient>
    </defs>
    <g>
      <rect height="14.9316" opacity="0" width="28.252" x="0" y="0" />
      <path
        d="M1.71875 13.5645C1.71875 14.4824 2.25586 14.9219 2.88086 14.9219C3.16406 14.9219 3.44727 14.834 3.73047 14.6777L13.9941 8.70117C14.7266 8.27148 15.0098 7.94922 15.0098 7.46094C15.0098 6.97266 14.7266 6.65039 13.9941 6.2207L3.73047 0.244141C3.44727 0.078125 3.16406 0 2.88086 0C2.25586 0 1.71875 0.429688 1.71875 1.34766ZM14.9609 13.5645C14.9609 14.4824 15.4883 14.9219 16.123 14.9219C16.3965 14.9219 16.6895 14.834 16.9727 14.6777L27.2266 8.70117C27.9688 8.27148 28.252 7.94922 28.252 7.46094C28.252 6.97266 27.9688 6.65039 27.2266 6.2207L16.9727 0.244141C16.6895 0.078125 16.3965 0 16.123 0C15.4883 0 14.9609 0.429688 14.9609 1.34766Z"
        fill="url(#forward-gradient)"
      />
    </g>
  </svg>
);

export const BackwardFillIcon: React.FC<IconSvgProps> = ({
  size = 36,
  width,
  height,
  ...props
}) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 28.252 14.9316"
    width={size || width}
    {...props}
  >
    <defs>
      <linearGradient
        id="backward-gradient"
        gradientUnits="userSpaceOnUse"
        x1="5"
        x2="5"
        y2="14.9219"
      >
        <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
        <stop offset="1" stopColor="currentColor" />
      </linearGradient>
    </defs>
    <g transform="scale(-1, 1)" transformOrigin="center">
      <rect height="14.9316" opacity="0" width="28.252" x="0" y="0" />
      <path
        d="M1.71875 13.5645C1.71875 14.4824 2.25586 14.9219 2.88086 14.9219C3.16406 14.9219 3.44727 14.834 3.73047 14.6777L13.9941 8.70117C14.7266 8.27148 15.0098 7.94922 15.0098 7.46094C15.0098 6.97266 14.7266 6.65039 13.9941 6.2207L3.73047 0.244141C3.44727 0.078125 3.16406 0 2.88086 0C2.25586 0 1.71875 0.429688 1.71875 1.34766ZM14.9609 13.5645C14.9609 14.4824 15.4883 14.9219 16.123 14.9219C16.3965 14.9219 16.6895 14.834 16.9727 14.6777L27.2266 8.70117C27.9688 8.27148 28.252 7.94922 28.252 7.46094C28.252 6.97266 27.9688 6.65039 27.2266 6.2207L16.9727 0.244141C16.6895 0.078125 16.3965 0 16.123 0C15.4883 0 14.9609 0.429688 14.9609 1.34766Z"
        fill="url(#backward-gradient)"
      />
    </g>
  </svg>
);

export const SunMaxFillIcon: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 21.4844 21.2012"
    width={size || width}
    {...props}
  >
    <defs>
      <linearGradient id="sun-max-gradient" gradientUnits="userSpaceOnUse" x1="5" x2="5" y2="21.1816">
        <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
        <stop offset="1" stopColor="currentColor" />
      </linearGradient>
    </defs>
    <g>
      <rect height="21.2012" opacity="0" width="21.4844" x="0" y="0" />
      <path
        d="M10.5664 3.79883C11.0254 3.79883 11.4062 3.41797 11.4062 2.94922L11.4062 0.849609C11.4062 0.380859 11.0254 0 10.5664 0C10.0977 0 9.7168 0.380859 9.7168 0.849609L9.7168 2.94922C9.7168 3.41797 10.0977 3.79883 10.5664 3.79883ZM15.3516 5.80078C15.6836 6.12305 16.2207 6.13281 16.5527 5.80078L18.0469 4.30664C18.3691 3.98438 18.3691 3.4375 18.0469 3.10547C17.7246 2.7832 17.1777 2.7832 16.8555 3.10547L15.3516 4.60938C15.0293 4.93164 15.0293 5.47852 15.3516 5.80078ZM17.334 10.5957C17.334 11.0547 17.7246 11.4355 18.1836 11.4355L20.2832 11.4355C20.7422 11.4355 21.123 11.0547 21.123 10.5957C21.123 10.1367 20.7422 9.74609 20.2832 9.74609L18.1836 9.74609C17.7246 9.74609 17.334 10.1367 17.334 10.5957ZM15.3516 15.3906C15.0293 15.7227 15.0293 16.2598 15.3516 16.582L16.8555 18.0957C17.1777 18.418 17.7246 18.3984 18.0469 18.0859C18.3691 17.7539 18.3691 17.2168 18.0469 16.8945L16.543 15.3906C16.2207 15.0684 15.6836 15.0781 15.3516 15.3906ZM10.5664 17.3926C10.0977 17.3926 9.7168 17.7734 9.7168 18.2324L9.7168 20.3418C9.7168 20.8008 10.0977 21.1816 10.5664 21.1816C11.0254 21.1816 11.4062 20.8008 11.4062 20.3418L11.4062 18.2324C11.4062 17.7734 11.0254 17.3926 10.5664 17.3926ZM5.77148 15.3906C5.43945 15.0781 4.89258 15.0684 4.57031 15.3906L3.07617 16.8848C2.75391 17.207 2.75391 17.7441 3.06641 18.0762C3.38867 18.3887 3.94531 18.4082 4.26758 18.0859L5.76172 16.582C6.08398 16.2598 6.08398 15.7227 5.77148 15.3906ZM3.78906 10.5957C3.78906 10.1367 3.39844 9.74609 2.93945 9.74609L0.839844 9.74609C0.380859 9.74609 0 10.1367 0 10.5957C0 11.0547 0.380859 11.4355 0.839844 11.4355L2.93945 11.4355C3.39844 11.4355 3.78906 11.0547 3.78906 10.5957ZM5.76172 5.80078C6.08398 5.48828 6.08398 4.92188 5.77148 4.60938L4.27734 3.10547C3.96484 2.79297 3.4082 2.7832 3.08594 3.10547C2.76367 3.4375 2.76367 3.98438 3.07617 4.29688L4.57031 5.80078C4.89258 6.12305 5.42969 6.12305 5.76172 5.80078Z"
        fill="url(#sun-max-gradient)"
      />
      <path
        d="M10.5566 15.5664C13.3008 15.5664 15.5273 13.3398 15.5273 10.5957C15.5273 7.85156 13.3008 5.61523 10.5566 5.61523C7.8125 5.61523 5.58594 7.85156 5.58594 10.5957C5.58594 13.3398 7.8125 15.5664 10.5566 15.5664Z"
        fill="url(#sun-max-gradient)"
      />
    </g>
  </svg>
);

export const MoonFillIcon: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => {
  const h = size || height || 36;
  const w = width || Number(h) * (19.9414 / 19.7349);

  return (
    <svg
      aria-hidden="true"
      height={h}
      viewBox="0 0 19.9414 19.7349"
      width={w}
      {...props}
    >
      <defs>
        <linearGradient id="moon-gradient" gradientUnits="userSpaceOnUse" x1="5" x2="5" y2="19.7161">
          <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <g>
        <rect height="19.7349" opacity="0" width="19.9414" x="0" y="0" />
        <path
          d="M10.2344 19.7161C14.4922 19.7161 17.9395 17.1477 19.4727 13.8762C19.8047 13.1926 19.3652 12.7336 18.7109 12.9387C17.9883 13.1829 16.7969 13.4172 15.6934 13.4172C9.83398 13.4172 6.47461 10.0579 6.47461 4.18873C6.47461 3.08521 6.71875 1.84498 7.07031 0.956304C7.35352 0.233648 6.85547-0.205805 6.16211 0.0969294C2.65625 1.62037 0 5.20435 0 9.48169C0 15.136 4.58984 19.7161 10.2344 19.7161Z"
          fill="url(#moon-gradient)"
        />
      </g>
    </svg>
  );
};

export const DisplayFillIcon: React.FC<IconSvgProps> = ({ size = 36, width, height, ...props }) => {
  const h = size || height || 36;
  const w = width || Number(h) * (23.6426 / 20.3613);

  return (
    <svg
      aria-hidden="true"
      height={h}
      viewBox="0 0 23.6426 20.3613"
      width={w}
      {...props}
    >
      <defs>
        <linearGradient
          id="display-gradient-1"
          gradientUnits="userSpaceOnUse"
          x1="5"
          x2="5"
          y1="0.683594"
          y2="20.3613"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity={0.2125} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0.2125} />
        </linearGradient>
        <linearGradient
          id="display-gradient-2"
          gradientUnits="userSpaceOnUse"
          x1="5"
          x2="5"
          y1="0.683594"
          y2="20.3613"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity={0.85} />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <g>
        <rect height="20.3613" opacity="0" width="23.6426" x="0" y="0" />
        <path
          d="M2.27539 15.3223C1.8457 15.3223 1.57227 15.0488 1.57227 14.6191L1.57227 2.95898C1.57227 2.51953 1.8457 2.25586 2.27539 2.25586L21.0059 2.25586C21.4355 2.25586 21.709 2.51953 21.709 2.95898L21.709 14.6191C21.709 15.0488 21.4355 15.3223 21.0059 15.3223Z"
          fill="url(#display-gradient-1)"
        />
        <path
          d="M2.24609 16.8945L21.0254 16.8945C22.4316 16.8945 23.2812 16.0449 23.2812 14.6387L23.2812 2.92969C23.2812 1.52344 22.4316 0.683594 21.0254 0.683594L2.24609 0.683594C0.849609 0.683594 0 1.52344 0 2.92969L0 14.6387C0 16.0449 0.849609 16.8945 2.24609 16.8945ZM2.27539 15.3223C1.8457 15.3223 1.57227 15.0488 1.57227 14.6191L1.57227 2.95898C1.57227 2.51953 1.8457 2.25586 2.27539 2.25586L21.0059 2.25586C21.4355 2.25586 21.709 2.51953 21.709 2.95898L21.709 14.6191C21.709 15.0488 21.4355 15.3223 21.0059 15.3223ZM8.55469 19.2188L14.7266 19.2188L14.7266 16.7676L8.55469 16.7676ZM8.49609 20.3613L14.7852 20.3613C15.2148 20.3613 15.5664 20.0098 15.5664 19.5703C15.5664 19.1309 15.2148 18.7793 14.7852 18.7793L8.49609 18.7793C8.06641 18.7793 7.70508 19.1309 7.70508 19.5703C7.70508 20.0098 8.06641 20.3613 8.49609 20.3613Z"
          fill="url(#display-gradient-2)"
        />
      </g>
    </svg>
  );
};
