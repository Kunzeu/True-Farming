'use client';

import type { ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
};

/** Shared img helper (same idea as next/image shim). */
export default function Img({ src, alt, width, height, priority, ...rest }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...rest}
    />
  );
}
