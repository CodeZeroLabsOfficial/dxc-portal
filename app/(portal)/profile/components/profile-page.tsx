"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Pencil } from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProfileHeader } from "./profile-header";
import { ProfileSidebar } from "./profile-sidebar";
import { ProfileProjects } from "./profile-projects";
import { EditProfileDialog } from "./edit-profile-dialog";

type ProfilePageProps = {
  userId?: string;
};

export function ProfilePage({ userId }: ProfilePageProps) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const targetUid = userId ?? user?.uid;
  const isOwnProfile = Boolean(user && targetUid === user.uid);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!targetUid) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (isOwnProfile && userProfile) {
        setProfile(userProfile);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", targetUid));
        if (cancelled) return;
        if (!snap.exists()) {
          setProfile(null);
          return;
        }
        const data = snap.data();
        setProfile({
          uid: snap.id,
          displayName: data.displayName ?? "User",
          email: data.email ?? "",
          photoURL: data.photoURL ?? null,
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
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [targetUid, isOwnProfile, userProfile]);

  if (loading) {
    return <div className="text-muted-foreground p-6 text-sm">Loading profile…</div>;
  }

  if (!profile) {
    return <div className="text-muted-foreground p-6 text-sm">Profile not found.</div>;
  }

  return (
    <div className="mx-auto min-h-screen lg:max-w-7xl xl:pt-6">
      <div className="space-y-4">
        <div className="bg-card overflow-hidden rounded-md border">
          <ProfileHeader
            profile={profile}
            actions={
              isOwnProfile ? (
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil />
                  Edit profile
                </Button>
              ) : null
            }
          />

          <div className="border-t px-4">
            <Tabs defaultValue="about">
              <TabsList className="-mb-0.5 h-auto! gap-6 border-none bg-transparent p-0">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!">
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!">
                  Projects
                </TabsTrigger>
              </TabsList>

              <div className="gap-4 space-y-4 py-4 lg:grid lg:space-y-0 xl:grid-cols-[300px_1fr]">
                <ProfileSidebar profile={profile} />
                <main>
                  <TabsContent value="about" className="mt-0">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Bio</h3>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {profile.bio || "No bio added yet."}
                      </p>
                      {profile.skills && profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {profile.skills.map((skill) => (
                            <span
                              key={skill}
                              className="bg-muted rounded-md px-2 py-1 text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </TabsContent>
                  <TabsContent value="projects" className="mt-0">
                    <ProfileProjects userId={profile.uid} />
                  </TabsContent>
                </main>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {isOwnProfile ? (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onSaved={async () => {
            await refreshProfile();
          }}
        />
      ) : null}
    </div>
  );
}
