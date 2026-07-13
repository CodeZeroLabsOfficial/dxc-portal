"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { PageContent } from "@/components/shared/page-content";
import { PageHeader } from "@/components/shared/page-header";
import { EventCalendar, type CalendarEvent, type EventColor } from "./";

function colorForType(type: string): EventColor {
  return type === "staff_movement" ? "amber" : "emerald";
}

function typeForColor(color?: EventColor): "annual_leave" | "staff_movement" {
  return color === "amber" ? "staff_movement" : "annual_leave";
}

export default function EventCalendarApp() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const q = query(collection(db, "calendarEvents"), orderBy("start", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((item) => {
            const data = item.data();
            const start = data.start instanceof Timestamp ? data.start.toDate() : new Date(data.start);
            const end = data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end);
            return {
              id: item.id,
              title: data.title,
              description: data.notes ?? data.type,
              start,
              end,
              allDay: data.allDay ?? true,
              color: colorForType(data.type),
              location: data.type === "staff_movement" ? "Staff movement" : "Annual leave"
            };
          })
        );
      },
      (error) => {
        console.error(error);
        toast.error("Unable to load calendar events");
      }
    );
    return () => unsubscribe();
  }, []);

  const handleEventAdd = async (event: CalendarEvent) => {
    if (!user) return;
    try {
      const type = typeForColor(event.color);
      await addDoc(collection(db, "calendarEvents"), {
        title: event.title,
        type,
        staffId: user.uid,
        start: Timestamp.fromDate(event.start),
        end: Timestamp.fromDate(event.end),
        allDay: event.allDay ?? true,
        notes: event.description ?? null,
        color: event.color ?? colorForType(type),
        status: "approved",
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Event created");
    } catch (error) {
      console.error(error);
      toast.error("Unable to create event");
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    if (!user) return;
    try {
      const type = typeForColor(updatedEvent.color);
      await updateDoc(doc(db, "calendarEvents", updatedEvent.id), {
        title: updatedEvent.title,
        type,
        start: Timestamp.fromDate(updatedEvent.start),
        end: Timestamp.fromDate(updatedEvent.end),
        allDay: updatedEvent.allDay ?? true,
        notes: updatedEvent.description ?? null,
        color: updatedEvent.color ?? colorForType(type)
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to update event");
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "calendarEvents", eventId));
      toast.success("Event deleted");
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete event");
    }
  };

  return (
    <PageContent>
      <PageHeader
        title="Calendar"
        description="Annual leave (emerald) and staff movements (amber). Org-wide."
      />
      <EventCalendar
        events={events}
        onEventAdd={(event) => void handleEventAdd(event)}
        onEventUpdate={(event) => void handleEventUpdate(event)}
        onEventDelete={(eventId) => void handleEventDelete(eventId)}
      />
    </PageContent>
  );
}
