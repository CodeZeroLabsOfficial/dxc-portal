"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

type ProjectDeleteDialogProps = {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectDeleteDialog({
  projectId,
  projectName,
  open,
  onOpenChange
}: ProjectDeleteDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "projects", projectId));
      toast.success("Project deleted");
      onOpenChange(false);
      router.push("/projects");
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete project");
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete “{projectName}”. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              void confirmDelete();
            }}>
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
