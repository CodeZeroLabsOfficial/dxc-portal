import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import type { UserPreferences, UserProfile } from "@/types";

export function profileCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;
  const checks = [
    Boolean(profile.displayName),
    Boolean(profile.email),
    Boolean(profile.photoURL),
    Boolean(profile.jobTitle),
    Boolean(profile.department),
    Boolean(profile.phone),
    Boolean(profile.location),
    Boolean(profile.bio)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<
    Pick<
      UserProfile,
      | "displayName"
      | "photoURL"
      | "coverURL"
      | "bio"
      | "jobTitle"
      | "department"
      | "phone"
      | "location"
      | "skills"
      | "language"
      | "preferences"
    >
  >
) {
  await updateDoc(doc(db, "users", uid), {
    ...patch,
    updatedAt: serverTimestamp()
  });

  if (auth.currentUser && auth.currentUser.uid === uid) {
    const authPatch: { displayName?: string; photoURL?: string } = {};
    if (patch.displayName) authPatch.displayName = patch.displayName;
    if (patch.photoURL) authPatch.photoURL = patch.photoURL;
    if (Object.keys(authPatch).length) {
      await updateProfile(auth.currentUser, authPatch);
    }
  }
}

export async function updateUserPreferences(uid: string, preferences: UserPreferences) {
  await updateDoc(doc(db, "users", uid), {
    preferences,
    updatedAt: serverTimestamp()
  });
}
