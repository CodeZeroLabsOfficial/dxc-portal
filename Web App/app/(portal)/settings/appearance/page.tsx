"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
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
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"])
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, userProfile, refreshProfile } = useAuth();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: { theme: "system" }
  });

  useEffect(() => {
    const saved = userProfile?.preferences?.theme ?? (theme as AppearanceFormValues["theme"]) ?? "system";
    form.reset({ theme: saved === "light" || saved === "dark" || saved === "system" ? saved : "system" });
  }, [userProfile, theme, form]);

  async function onSubmit(data: AppearanceFormValues) {
    if (!user || !userProfile) return;
    try {
      setTheme(data.theme);
      await updateUserPreferences(user.uid, {
        ...userProfile.preferences,
        theme: data.theme
      });
      await refreshProfile();
      toast.success("Appearance updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update appearance");
    }
  }

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Theme</FormLabel>
                  <FormDescription>Choose light, dark, or follow system.</FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        setTheme(value);
                      }}
                      value={field.value}
                      className="flex max-w-md flex-col gap-3 pt-2">
                      {(["light", "dark", "system"] as const).map((value) => (
                        <FormItem key={value} className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={value} />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">{value}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Update preferences</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
