"use client";

import { Briefcase, Mail, Phone, TrendingUp, Users } from "lucide-react";

import type { UserProfile } from "@/types";
import { profileCompletion } from "@/lib/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function roleLabel(role: UserProfile["role"]) {
  if (role === "admin") return "Org admin";
  if (role === "manager") return "Manager";
  return "Staff";
}

export function ProfileSidebar({ profile }: { profile: UserProfile }) {
  const completion = profileCompletion(profile);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Progress value={completion} className="flex-1" indicatorColor="bg-green-500" />
            <span className="text-muted-foreground text-xs">{completion}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold">About</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Users className="text-muted-foreground h-4 w-4" />
            <span>{profile.displayName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Briefcase className="text-muted-foreground h-4 w-4" />
            <span>{profile.department || "No department"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <TrendingUp className="text-muted-foreground h-4 w-4" />
            <span>{profile.jobTitle || roleLabel(profile.role)}</span>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">Contacts</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="break-all">{profile.email}</span>
            </div>
            {profile.phone ? (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
