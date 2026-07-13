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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

const displayFormSchema = z.object({
  showProjects: z.boolean(),
  showServiceRequests: z.boolean(),
  showCalendar: z.boolean()
});

type DisplayFormValues = z.infer<typeof displayFormSchema>;

export default function DisplaySettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      showProjects: true,
      showServiceRequests: true,
      showCalendar: true
    }
  });

  useEffect(() => {
    const prefs = userProfile?.preferences?.display;
    form.reset({
      showProjects: prefs?.showProjects ?? true,
      showServiceRequests: prefs?.showServiceRequests ?? true,
      showCalendar: prefs?.showCalendar ?? true
    });
  }, [userProfile, form]);

  async function onSubmit(data: DisplayFormValues) {
    if (!user || !userProfile) return;
    try {
      await updateUserPreferences(user.uid, {
        ...userProfile.preferences,
        display: data
      });
      await refreshProfile();
      toast.success("Display preferences saved");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save display preferences");
    }
  }

  const fields: Array<{
    name: keyof DisplayFormValues;
    label: string;
  }> = [
    { name: "showProjects", label: "Projects" },
    { name: "showServiceRequests", label: "Service requests" },
    { name: "showCalendar", label: "Calendar" }
  ];

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Sidebar sections</FormLabel>
                <FormDescription>
                  Choose which main sections you prefer to keep visible.
                </FormDescription>
              </div>
              {fields.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">{item.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
              <FormMessage />
            </FormItem>
            <Button type="submit">Update display</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
