"use client";

import type { ImgHTMLAttributes } from "react";

export type RemoteMediaProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

/**
 * Renders user/API media without next/image host allowlisting.
 * Prefer this for uploads, blob previews, and any host that is not in remotePatterns.
 */
export function RemoteMedia({ src, alt, className, loading = "lazy", ...rest }: RemoteMediaProps) {
  return (
    // API media can use arbitrary hosts; retain native loading without a remote allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading={loading} decoding="async" {...rest} />
  );
}
