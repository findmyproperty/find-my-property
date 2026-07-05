"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Briefcase, Clock, Loader2, MapPin, Star, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { PublicVendorProfile } from "@/schema/vendor";

type Props = {
  idOrSlug: string;
};

export default function PublicVendorProfilePage({ idOrSlug }: Props) {
  const [profile, setProfile] = useState<PublicVendorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.vendors
      .getPublicProfile(idOrSlug)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled) {
          setProfile(null);
          setError(e instanceof Error ? e.message : "Partner not found");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Partner not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This profile may be unverified or no longer available.
        </p>
        <Link href="/" className="text-primary text-sm mt-4 inline-block hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const name = profile.businessName?.trim() || "Verified partner";
  const categories = profile.categories ?? [];
  const ratingText =
    profile.overallRating && profile.reviewCount
      ? `${profile.overallRating.toFixed(1)} (${profile.reviewCount} review${
          profile.reviewCount === 1 ? "" : "s"
        })`
      : "New partner";

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14 mt-20">
      <header className="space-y-3">
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
        ) : (
          <Badge variant="secondary">Verified partner</Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {profile.vendorName ? (
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {profile.vendorName}
            </p>
          ) : null}
          <p className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            {ratingText}
          </p>
          <p className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {profile.completedJobsCount} completed job
            {profile.completedJobsCount === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {profile.publicPhotoUrls?.length ? (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profile.publicPhotoUrls.map((url, i) => (
            <div
              key={url}
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
            >
              <Image
                src={url}
                alt={`${name} ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      ) : null}

      <section className="mt-8 space-y-6">
        {profile.about ? (
          <div>
            <h2 className="font-semibold">About</h2>
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{profile.about}</p>
          </div>
        ) : null}

        {profile.experience ? (
          <div>
            <h2 className="font-semibold">Experience</h2>
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
              {profile.experience}
            </p>
          </div>
        ) : null}

        {profile.serviceLocations?.length ? (
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Service areas
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {profile.serviceLocations.map((loc) => (
                <Badge key={loc} variant="outline">
                  {loc}
                </Badge>
              ))}
            </ul>
          </div>
        ) : null}

        {profile.workingHours ? (
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Working hours
            </h2>
            <p className="text-muted-foreground mt-2">{profile.workingHours}</p>
          </div>
        ) : null}

        {profile.certificateUrls?.length ? (
          <div>
            <h2 className="font-semibold">Certifications</h2>
            <ul className="mt-2 space-y-1">
              {profile.certificateUrls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View certificate
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Verified Find My Property partner · Book services through our platform
      </p>
    </article>
  );
}
