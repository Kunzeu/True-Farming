import type { ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
};

/** Shim for next/image — images were already unoptimized in next.config. */
export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  style,
  onError,
  onLoad,
  sizes: _sizes,
  quality: _q,
  placeholder: _ph,
  blurDataURL: _b,
  unoptimized: _u,
  loader: _l,
  ...rest
}: Props) {
  const imgStyle = fill
    ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const, ...style }
    : style;

  return (
    <img
      src={typeof src === 'string' ? src : String(src)}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={imgStyle}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={onError}
      onLoad={onLoad}
      {...rest}
    />
  );
}
