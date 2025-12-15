import { BookingCalendar } from "@/components/dashboard/BookingCalendar";

export function CalendarPage() {
    return (
        <div className="space-y-2 h-[calc(100vh-6rem)] flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent shrink-0">
                Booking Calendar
            </h1>
            <div className="flex-1 min-h-0 bg-white rounded-lg border shadow-sm p-0 overflow-hidden">
                <BookingCalendar />
            </div>
        </div>
    );
}
