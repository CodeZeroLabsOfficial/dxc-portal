"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { updateUserPreferences } from "@/lib/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const notificationsFormSchema = z.object({
  serviceRequestUpdates: z.boolean(),
  projectUpdates: z.boolean(),
  leaveApprovals: z.boolean(),
  emailDigest: z.boolean()
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export default function NotificationsSettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      serviceRequestUpdates: true,
      projectUpdates: true,
      leaveApprovals: true,
      emailDigest: false
    }
  });

  useEffect(() => {
    const prefs = userProfile?.preferences?.notifications;
    form.reset({
      serviceRequestUpdates: prefs?.serviceRequestUpdates ?? true,
      projectUpdates: prefs?.projectUpdates ?? true,
      leaveApprovals: prefs?.leaveApprovals ?? true,
      emailDigest: prefs?.emailDigest ?? false
    });
  }, [userProfile, form]);

  async function onSubmit(data: NotificationsFormValues) {
    if (!user || !userProfile) return;
    try {
      await updateUserPreferences(user.uid, {
        ...userProfile.preferences,
        notifications: data
      });
      await refreshProfile();
      toast.success("Notification preferences saved");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save notification preferences");
    }
  }

  const fields: Array<{
    name: keyof NotificationsFormValues;
    label: string;
    description: string;
  }> = [
    {
      name: "serviceRequestUpdates",
      label: "Service request updates",
      description: "Stage changes and assignments for service requests."
    },
    {
      name: "projectUpdates",
      label: "Project updates",
      description: "Progress and status changes on projects you manage."
    },
    {
      name: "leaveApprovals",
      label: "Leave and movement updates",
      description: "Changes related to calendar leave and staff movements."
    },
    {
      name: "emailDigest",
      label: "Email digest",
      description: "Periodic summary email of portal activity."
    }
  ];

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {fields.map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{item.label}</FormLabel>
                      <FormDescription>{item.description}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit">Update notifications</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
