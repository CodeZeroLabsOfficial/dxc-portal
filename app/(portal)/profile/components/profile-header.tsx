"use client";

import { Calendar, MapPin, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import type { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1735926199195-85b726600751?auto=format&fit=crop&q=80&w=1600";

function roleLabel(role: UserProfile["role"]) {
  if (role === "admin") return "Org admin";
  if (role === "manager") return "Manager";
  return "Staff";
}

export function ProfileHeader({
  profile,
  actions
}: {
  profile: UserProfile;
  actions?: ReactNode;
}) {
  const cover = profile.coverURL || DEFAULT_COVER;
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <div
        className="relative aspect-3/1 w-full rounded-t-md bg-cover bg-center md:max-h-[240px]"
        style={{ backgroundImage: `url('${cover}')` }}>
        {actions ? <div className="absolute end-4 top-4">{actions}</div> : null}
      </div>

      <div className="-mt-10 px-4 pb-4 text-center lg:-mt-14">
        <Avatar className="border-background mx-auto size-20 border-4 lg:size-28">
          <AvatarImage src={profile.photoURL ?? undefined} alt={profile.displayName} />
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
        <h4 className="text-lg font-semibold lg:text-2xl">{profile.displayName}</h4>
        <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>{profile.jobTitle || roleLabel(profile.role)}</span>
          </div>
          {profile.location ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{profile.location}</span>
            </div>
          ) : null}
          <div className="hidden items-center gap-1.5 lg:flex">
            <Calendar className="h-4 w-4" />
            <span>{roleLabel(profile.role)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
