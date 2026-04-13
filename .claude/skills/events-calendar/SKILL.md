---
name: events-calendar
description: Building interactive event calendars, appointment schedulers, or any time-based view with drag-and-drop support in this project — using the pre-configured EventsCalendar component that wraps react-big-calendar. Load this skill whenever the task involves a calendar view, event scheduling, time slots, appointments, or drag-and-drop event management.
user-invocable: false
---

# Event Calendar Skill

Use this skill to build interactive event calendars with drag-and-drop support using the EventsCalendar component.

## When to Use

- User requests a calendar view for events, appointments, or schedules
- User needs drag-and-drop event management
- User wants to display time-based data in a calendar format
- User needs event creation by clicking on time slots

## Overview

**EventsCalendar** wraps `react-big-calendar` with theming, localization, and drag-and-drop pre-configured. All `react-big-calendar` props work.

## Import

```tsx
import { EventsCalendar, Event, Slot } from '@/components/ui/events-calendar';
```

---

## Complete Example

```tsx
import { EventsCalendar, Event, Slot } from '@/components/ui/events-calendar';
import {
  useEntityGetAll,
  useEntityUpdate,
  useEntityCreate,
} from '@blocksdiy/blocks-client-sdk/reactSdk';

function Calendar() {
  const { data: appointments } = useEntityGetAll(AppointmentsEntity);
  const { updateFunction } = useEntityUpdate(AppointmentsEntity);
  const { createFunction } = useEntityCreate(AppointmentsEntity);

  // Transform: DB (ISO strings) → Calendar (Date objects)
  const events: Event[] =
    appointments?.map((apt) => ({
      title: apt.title,
      start: new Date(apt.startDateTime),
      end: new Date(apt.endDateTime),
      allDay: apt.isAllDay, // Only if entity has this field
      resource: apt,
    })) || [];

  // Slot clicked - slotInfo has start/end Date objects with time
  async function handleSelectSlot(slotInfo: Slot) {
    await createFunction({
      data: {
        startDateTime: slotInfo.start.toISOString(),
        endDateTime: slotInfo.end.toISOString(),
      },
    });
  }

  // Event dragged - start/end are NEW Date objects
  async function handleEventDrop({ event, start, end, allDay }: Event) {
    // allDay param = true if dropped on all-day row, false if on time slot
    const data: Record<string, any> = {
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    };

    // Only handle allDay if entity has isAllDay field:
    if (event.resource.hasOwnProperty('isAllDay')) {
      let newAllDay = event.allDay;
      if (!event.allDay && allDay) newAllDay = true;
      if (event.allDay && !allDay) newAllDay = false;
      data.isAllDay = newAllDay;
    }

    await updateFunction({ id: event.resource.id, data });
  }

  // Event resized - start/end are NEW Date objects
  async function handleEventResize({ event, start, end }: Event) {
    await updateFunction({
      id: event.resource.id,
      data: {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      },
    });
  }

  return (
    <EventsCalendar
      events={events}
      onSelectSlot={handleSelectSlot}
      onEventDrop={handleEventDrop}
      onEventResize={handleEventResize}
      style={{ height: '700px' }}
    />
  );
}
```

---

## Custom Event Styling

Use theme color tokens for event backgrounds:

```tsx
<EventsCalendar
  events={events}
  onSelectSlot={handleSelectSlot}
  onEventDrop={handleEventDrop}
  onEventResize={handleEventResize}
  eventPropGetter={(e) => ({
    style: { backgroundColor: 'hsl(var(--chart-1))', color: 'white' },
  })}
  style={{ height: '700px' }}
/>
```

You can use `eventPropGetter` to color-code events by category:

```tsx
eventPropGetter={(event) => {
  const colorMap: Record<string, string> = {
    meeting: "hsl(var(--chart-1))",
    deadline: "hsl(var(--chart-2))",
    personal: "hsl(var(--chart-3))",
  };
  return {
    style: {
      backgroundColor: colorMap[event.resource?.type] || "hsl(var(--chart-1))",
      color: "white",
    },
  };
}}
```

---

## CRITICAL RULES

1. **Events use Date objects**: `start: new Date(apt.startDateTime)` (ISO string -> Date)
2. **Save as ISO strings**: `start.toISOString()` (Date -> ISO string)
3. **BOTH handlers required**: `onEventDrop` AND `onEventResize` - both must be provided
4. **If entity has `isAllDay` field**: Use `allDay` param in `onEventDrop` (tells if dropped on all-day row!)
5. **Height on component**: `style={{ height: "700px" }}` - set height directly, NO wrapper divs!

## Fatal Mistakes to AVOID

- **NEVER** pass strings to events - `start` and `end` must be `Date` objects
- **NEVER** omit `onEventDrop` or `onEventResize` handlers
- **NEVER** wrap in container divs for sizing - set height directly on EventsCalendar
- **NEVER** forget to convert ISO strings from DB to Date objects
- **NEVER** forget to convert Date objects back to ISO strings when saving
