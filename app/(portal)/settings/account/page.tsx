"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile } from "@/lib/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const accountFormSchema = z.object({
  displayName: z.string().min(2).max(60),
  language: z.string().min(2),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional()
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountSettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      displayName: "",
      language: "en",
      phone: "",
      jobTitle: "",
      department: ""
    }
  });

  useEffect(() => {
    if (!userProfile) return;
    form.reset({
      displayName: userProfile.displayName,
      language: userProfile.language ?? "en",
      phone: userProfile.phone ?? "",
      jobTitle: userProfile.jobTitle ?? "",
      department: userProfile.department ?? ""
    });
  }, [userProfile, form]);

  async function onSubmit(data: AccountFormValues) {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, {
        displayName: data.displayName.trim(),
        language: data.language,
        phone: data.phone?.trim() || null,
        jobTitle: data.jobTitle?.trim() || null,
        department: data.department?.trim() || null
      });
      await refreshProfile();
      toast.success("Account updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update account");
    }
  }

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormDescription>Shown across DXC Portal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
                  <FormControl>
                    <Input placeholder="Project manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Delivery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+61 …" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Portal language preference.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Update account</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
