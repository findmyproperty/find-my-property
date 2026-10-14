"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PropertyGalleryGridProps = {
  images: string[];
  alt: string;
};

function GalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return <img src={src} alt={alt} className={cn("size-full object-cover", className)} />;
}

function GalleryTile({
  src,
  alt,
  label,
  onClick,
  className,
  overlay,
}: {
  src: string;
  alt: string;
  label: string;
  onClick: () => void;
  className?: string;
  overlay?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative block w-full overflow-hidden rounded-xl bg-muted text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <GalleryImage src={src} alt={alt} />
      {overlay}
    </button>
  );
}

/** NoBroker-style mosaic: layout adapts to 1, 2, or 3+ photos (no empty grid holes). */
export function PropertyGalleryGrid({ images, alt }: PropertyGalleryGridProps) {
  const [mainIndex, setMainIndex] = useState(0);
  const safeImages = images.length > 0 ? images : [];
  const count = safeImages.length;
  const main = safeImages[mainIndex] ?? safeImages[0];
  const secondaryIndex = mainIndex === 0 ? 1 : 0;

  if (count === 0) {
    return (
      <div className="flex aspect-[16/10] max-h-[min(52vh,28rem)] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        No photos
      </div>
    );
  }

  const extraCount = Math.max(0, count - 3);

  return (
    <div className="space-y-3">
      <div className="hidden sm:block">
        {count === 1 ? (
          <GalleryTile
            src={safeImages[0]}
            alt={alt}
            label="Main property photo"
            onClick={() => setMainIndex(0)}
            className="aspect-[16/10] max-h-[min(52vh,28rem)]"
          />
        ) : count === 2 ? (
          <div className="grid max-h-[min(52vh,28rem)] min-h-[220px] grid-cols-3 gap-2 lg:min-h-[320px]">
            <GalleryTile
              src={main}
              alt={alt}
              label="Main property photo"
              onClick={() => setMainIndex(mainIndex)}
              className="col-span-2 h-full min-h-[220px] lg:min-h-[320px]"
            />
            <GalleryTile
              src={safeImages[secondaryIndex]}
              alt=""
              label="Property photo 2"
              onClick={() => setMainIndex(secondaryIndex)}
              className="col-span-1 h-full min-h-[220px] lg:min-h-[320px]"
            />
          </div>
        ) : (
          <div className="grid max-h-[min(52vh,28rem)] min-h-[220px] grid-cols-3 grid-rows-2 gap-2 lg:min-h-[320px]">
            <GalleryTile
              src={main}
              alt={alt}
              label="Main property photo"
              onClick={() => setMainIndex(mainIndex)}
              className="col-span-2 row-span-2 h-full min-h-[220px] lg:min-h-[320px]"
            />
            <GalleryTile
              src={safeImages[1]}
              alt=""
              label="Property photo 2"
              onClick={() => setMainIndex(1)}
              className="col-span-1 row-span-1 min-h-0"
            />
            <GalleryTile
              src={safeImages[2]}
              alt=""
              label="Property photo 3"
              onClick={() => setMainIndex(2)}
              className="col-span-1 row-span-1 min-h-0"
              overlay={
                extraCount > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                    +{extraCount}
                  </span>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      <div className="sm:hidden">
        <GalleryTile
          src={main}
          alt={alt}
          label="Main property photo"
          onClick={() => setMainIndex(mainIndex)}
          className="aspect-[4/3] w-full"
        />
      </div>

      {count > 1 ? (
        <div
          className={cn(
            "flex gap-2 overflow-x-auto pb-1",
            count >= 3 ? "sm:flex" : "sm:flex lg:hidden",
          )}
        >
          {safeImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setMainIndex(i)}
              className={cn(
                "h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-muted",
                mainIndex === i ? "border-primary" : "border-transparent",
              )}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {count > 3 ? (
        <div className="hidden flex-wrap gap-2 lg:flex">
          {safeImages.slice(3, 8).map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              type="button"
              onClick={() => setMainIndex(i + 3)}
              className={cn(
                "h-14 w-14 overflow-hidden rounded-lg border-2 bg-muted",
                mainIndex === i + 3 ? "border-primary" : "border-border",
              )}
              aria-label={`Photo ${i + 4}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
