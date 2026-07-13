"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function upsertUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email || "",
      photoURL: user.photoURL,
      role: "staff",
      language: "en",
      preferences: {
        theme: "system",
        notifications: {
          serviceRequestUpdates: true,
          projectUpdates: true,
          leaveApprovals: true,
          emailDigest: false
        },
        display: {
          showProjects: true,
          showServiceRequests: true,
          showCalendar: true
        }
      }
    };

    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (!user.displayName && profile.displayName) {
      await updateProfile(user, { displayName: profile.displayName });
    }

    return profile;
  }

  const data = snap.data();
  return {
    uid: user.uid,
    displayName: data.displayName ?? user.displayName ?? "User",
    email: data.email ?? user.email ?? "",
    photoURL: data.photoURL ?? user.photoURL,
    coverURL: data.coverURL ?? null,
    bio: data.bio ?? null,
    jobTitle: data.jobTitle ?? null,
    department: data.department ?? null,
    phone: data.phone ?? null,
    location: data.location ?? null,
    skills: data.skills ?? [],
    language: data.language ?? "en",
    role: data.role ?? "staff",
    activeClientId: data.activeClientId ?? null,
    preferences: data.preferences
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setUserProfile(null);
      return;
    }
    const profile = await upsertUserProfile(auth.currentUser);
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const profile = await upsertUserProfile(nextUser);
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to load user profile", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      signIn,
      signOut,
      refreshProfile
    }),
    [user, userProfile, loading, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
