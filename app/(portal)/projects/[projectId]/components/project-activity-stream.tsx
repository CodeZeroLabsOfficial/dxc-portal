"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Clock12Icon } from "lucide-react";

import { db } from "@/lib/firebase";
import { formatActivityTimestamp } from "@/lib/project-activity";
import { toProjectDate } from "@/lib/projects";
import type { ProjectActivity } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle
} from "@/components/ui/timeline";

type ProjectActivityStreamProps = {
  projectId: string;
};

const PREVIEW_LIMIT = 8;

export function ProjectActivityStream({ projectId }: ProjectActivityStreamProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "projects", projectId, "activities"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setActivities(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            type: data.type,
            title: data.title,
            description: data.description ?? null,
            actorId: data.actorId ?? null,
            actorName: data.actorName ?? null,
            createdAt: toProjectDate(data.createdAt)
          };
        })
      );
    });
    return () => unsubscribe();
  }, [projectId]);

  const visible = showAll ? activities : activities.slice(0, PREVIEW_LIMIT);

  return (
    <Card className="overflow-hidden pb-0">
      <CardHeader>
        <CardTitle>Activity stream</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet on this project.</p>
        ) : (
          <Timeline defaultValue={visible.length}>
            {visible.map((activity, index) => (
              <TimelineItem key={activity.id} step={index + 1} className="space-y-2">
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineTitle className="-mt-0.5">{activity.title}</TimelineTitle>
                  <TimelineIndicator />
                </TimelineHeader>
                <TimelineContent className="space-y-2">
                  {activity.description ? (
                    <p className="text-muted-foreground text-sm">{activity.description}</p>
                  ) : null}
                  {activity.actorName ? (
                    <p className="text-muted-foreground text-xs">By {activity.actorName}</p>
                  ) : null}
                  <TimelineDate className="mt-2 mb-0 flex items-center gap-1.5">
                    <Clock12Icon className="size-3" />
                    {formatActivityTimestamp(activity.createdAt)}
                  </TimelineDate>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
      {activities.length > PREVIEW_LIMIT ? (
        <CardFooter className="border-t p-0!">
          <Button
            variant="link"
            className="w-full rounded-none"
            onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show less" : "View more"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
