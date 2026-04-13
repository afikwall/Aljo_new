// temp fix for https://github.com/jquense/react-big-calendar/issues/2795
import * as React from 'react';
import '@/lib/require-shim';
import { format } from 'date-fns/format';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import {
  dateFnsLocalizer,
  Views,
  Calendar,
  type Event,
  type SlotInfo,
  type CalendarProps,
} from 'react-big-calendar';
import WithDragAndDropDefault from 'react-big-calendar/lib/addons/dragAndDrop';
import { cn } from '@/lib/utils';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './events-calendar.css';

const withDragAndDrop: typeof WithDragAndDropDefault =
  typeof WithDragAndDropDefault === 'function'
    ? WithDragAndDropDefault
    : ((WithDragAndDropDefault as Record<string, unknown>)
        .default as typeof WithDragAndDropDefault);

const locales = {
  'en-US': enUS,
};

const dateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DragAndDropReactBigCalendar = withDragAndDrop(Calendar);

const EventsCalendar = ({
  className,
  localizer = dateLocalizer,
  selectable = true,
  resizable = true,
  draggableAccessor = () => true,
  resizableAccessor = () => true,
  ...props
}: WithDragAndDropDefault.withDragAndDropProps & CalendarProps) => {
  const [view, setView] = React.useState(props.view || Views.WEEK);
  const [date, setDate] = React.useState(props.date || new Date());

  return (
    <DragAndDropReactBigCalendar
      className={cn('w-full h-full border-2 rounded-md', className)}
      date={props.date || date}
      onNavigate={props.onNavigate || setDate}
      view={props.view || view}
      onView={props.onView || setView}
      localizer={localizer}
      selectable={selectable}
      resizable={resizable}
      draggableAccessor={draggableAccessor}
      resizableAccessor={resizableAccessor}
      {...props}
    />
  );
};

type Slot = SlotInfo;

export { EventsCalendar, Views, Event, Slot };
