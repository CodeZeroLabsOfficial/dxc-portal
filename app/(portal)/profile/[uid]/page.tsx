"use client";

import { use } from "react";
import { ProfilePage } from "../components/profile-page";

export default function Page({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  return <ProfilePage userId={uid} />;
}
