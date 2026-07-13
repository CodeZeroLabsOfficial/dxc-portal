"use client";

import { useEffect, useId, useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import type { UserProfile } from "@/types";
import { uploadFile } from "@/lib/storage";
import { updateUserProfile } from "@/lib/user-profile";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onSaved: () => Promise<void>;
};

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSaved
}: EditProfileDialogProps) {
  const id = useId();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? "");
  const [department, setDepartment] = useState(profile.department ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [saving, setSaving] = useState(false);

  const {
    value: bioValue,
    characterCount,
    handleChange: handleBioChange,
    maxLength: limit,
    setValue: setBioValue
  } = useCharacterLimit({
    initialValue: profile.bio ?? "",
    maxLength: 180
  });

  const [{ files: coverFiles }, coverActions] = useFileUpload({
    accept: "image/*",
    initialFiles: profile.coverURL
      ? [{ id: "cover", name: "cover.jpg", size: 0, type: "image/jpeg", url: profile.coverURL }]
      : []
  });

  const [{ files: avatarFiles }, avatarActions] = useFileUpload({
    accept: "image/*",
    initialFiles: profile.photoURL
      ? [{ id: "avatar", name: "avatar.jpg", size: 0, type: "image/jpeg", url: profile.photoURL }]
      : []
  });

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile.displayName);
    setJobTitle(profile.jobTitle ?? "");
    setDepartment(profile.department ?? "");
    setPhone(profile.phone ?? "");
    setLocation(profile.location ?? "");
    setBioValue(profile.bio ?? "");
  }, [open, profile, setBioValue]);

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      let photoURL = profile.photoURL ?? null;
      let coverURL = profile.coverURL ?? null;

      const avatarFile = avatarFiles[0]?.file;
      if (avatarFile instanceof File) {
        const uploaded = await uploadFile(
          `avatars/${profile.uid}/${Date.now()}-${avatarFile.name}`,
          avatarFile
        );
        photoURL = uploaded.url;
      } else if (!avatarFiles[0]) {
        photoURL = null;
      }

      const coverFile = coverFiles[0]?.file;
      if (coverFile instanceof File) {
        const uploaded = await uploadFile(
          `covers/${profile.uid}/${Date.now()}-${coverFile.name}`,
          coverFile
        );
        coverURL = uploaded.url;
      } else if (!coverFiles[0]) {
        coverURL = null;
      }

      await updateUserProfile(profile.uid, {
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim() || null,
        department: department.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        bio: bioValue.trim() || null,
        photoURL,
        coverURL
      });

      await onSaved();
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  const coverPreview = coverFiles[0]?.preview ?? null;
  const avatarPreview = avatarFiles[0]?.preview ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="font-normal">Edit profile</DialogTitle>
          <DialogDescription className="sr-only">
            Update your photo, cover image, and profile details.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto">
          <div className="bg-muted relative flex h-32 items-center justify-center overflow-hidden">
            {coverPreview ? (
              <img alt="Cover preview" className="size-full object-cover" src={coverPreview} />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Upload cover"
                className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white"
                onClick={coverActions.openFileDialog}>
                <ImagePlusIcon size={16} />
              </button>
              {coverPreview ? (
                <button
                  type="button"
                  aria-label="Remove cover"
                  className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white"
                  onClick={() => coverActions.removeFile(coverFiles[0]?.id ?? "")}>
                  <XIcon size={16} />
                </button>
              ) : null}
            </div>
            <input {...coverActions.getInputProps()} className="sr-only" />
          </div>

          <div className="-mt-10 px-6">
            <div className="border-background bg-muted relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4">
              {avatarPreview ? (
                <img alt="Avatar preview" className="size-full object-cover" src={avatarPreview} />
              ) : null}
              <button
                type="button"
                aria-label="Upload avatar"
                className="absolute flex size-8 items-center justify-center rounded-full bg-black/60 text-white"
                onClick={avatarActions.openFileDialog}>
                <ImagePlusIcon size={16} />
              </button>
              <input {...avatarActions.getInputProps()} className="sr-only" />
            </div>
          </div>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Display name</Label>
              <Input
                id={`${id}-name`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${id}-title`}>Job title</Label>
                <Input
                  id={`${id}-title`}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-department`}>Department</Label>
                <Input
                  id={`${id}-department`}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${id}-phone`}>Phone</Label>
                <Input id={`${id}-phone`} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-location`}>Location</Label>
                <Input
                  id={`${id}-location`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-bio`}>Bio</Label>
              <Textarea
                id={`${id}-bio`}
                maxLength={180}
                value={bioValue}
                onChange={handleBioChange}
                placeholder="A short introduction"
              />
              <p className="text-muted-foreground text-right text-xs">
                {limit - characterCount} characters left
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
