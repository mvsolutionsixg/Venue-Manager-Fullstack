import { useState, useEffect } from "react";
import { format, addMinutes, parse, isSameDay, set } from "date-fns";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function BookingCalendar() {
    // State
    const [date, setDate] = useState<Date>(new Date());
    const [courts, setCourts] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>({
        open_time: "05:00",
        close_time: "23:00",
        slot_duration: 60
    });

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ court: any, time: string } | null>(null);

    // Initial Fetch
    useEffect(() => {
        fetchSettings();
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchData();
    }, [date]);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/settings/");
            if (res.data) {
                // Ensure format HH:mm
                const s = res.data;
                setSettings({
                    open_time: s.open_time.substring(0, 5),
                    close_time: s.close_time.substring(0, 5),
                    slot_duration: s.slot_duration
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const fetchCourts = async () => {
        try {
            const res = await api.get(`/courts/`);
            const activeCourts = res.data.filter((c: any) => c.is_active);
            setCourts(activeCourts);
        } catch (error) {
            console.error("Failed to fetch courts", error);
        }
    }

    const fetchData = async () => {
        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const res = await api.get(`/bookings/?date=${formattedDate}`);
            setBookings(res.data);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        }
    };

    const handleBooking = async () => {
        if (!selectedSlot || !customerName) return;

        try {
            setLoading(true);
            const startTimeString = selectedSlot.time; // "05:00"
            const startTimeDate = parse(startTimeString, "HH:mm", new Date());

            // Calculate end time based on slot duration
            const endTimeDate = addMinutes(startTimeDate, settings.slot_duration);

            const startParam = startTimeString + ":00";
            const endParam = format(endTimeDate, "HH:mm:ss");

            await api.post("/bookings/", {
                court_id: selectedSlot.court.id,
                date: format(date, "yyyy-MM-dd"),
                start_time: startParam,
                end_time: endParam,
                customer_name: customerName,
                status: "booked"
            });

            setOpenDialog(false);
            setCustomerName("");
            fetchData(); // Refresh bookings
            alert("Booking Successful!");
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Failed to book";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // Generate Slots
    const slots: string[] = [];
    if (settings) {
        let current = parse(settings.open_time, "HH:mm", new Date());
        const end = parse(settings.close_time, "HH:mm", new Date());

        // Safety break to prevent infinite loop if times are weird
        let count = 0;
        while (current < end && count < 100) {
            slots.push(format(current, "HH:mm"));
            current = addMinutes(current, settings.slot_duration);
            count++;
        }
    }

    const getSlotStatus = (courtId: number, time: string) => {
        return bookings.find(b =>
            b.court_id === courtId &&
            b.start_time.startsWith(time)
        );
    };

    if (courts.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading configuration...</div>;
    }

    return (
        <div className="flex flex-col h-full space-y-1 bg-slate-50 p-1 rounded-xl">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-[200px] h-8 justify-start text-left font-normal text-xs", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        <Button variant="ghost" size="sm" onClick={() => setDate(d => addMinutes(d, -1440))} className="h-7 w-7 p-0 hover:bg-white hover:shadow-sm">
                            <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <span className="px-2 text-xs font-medium text-slate-600">
                            {format(date, "EEE, MMM do")}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setDate(d => addMinutes(d, 1440))} className="h-7 w-7 p-0 hover:bg-white hover:shadow-sm">
                            <ChevronRight className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
                <div>
                    <Button variant="outline" size="sm" onClick={() => setDate(new Date())} className="h-8 text-xs text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                        Today
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 overflow-auto relative">
                <div className="grid border-b border-slate-200 bg-slate-50 sticky top-0 z-20" style={{ gridTemplateColumns: `80px repeat(${courts.length}, 1fr)` }}>
                    <div className="p-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-100">
                        Time
                    </div>
                    {courts.map(court => (
                        <div key={court.id} className="p-2 text-center text-sm font-bold text-slate-700 border-r border-slate-100 last:border-r-0">
                            {court.name}
                        </div>
                    ))}
                </div>

                <div className="divide-y divide-slate-100">
                    {slots.map((slot) => (
                        <div key={slot} className="grid min-h-[32px] hover:bg-slate-50/50 transition-colors" style={{ gridTemplateColumns: `80px repeat(${courts.length}, 1fr)` }}>
                            {/* Time Column */}
                            <div className="p-1 flex items-center justify-center text-xs font-medium text-slate-500 border-r border-slate-100 bg-slate-50/30 sticky left-0 z-10">
                                {slot}
                            </div>

                            {/* Court Slots */}
                            {courts.map(court => {
                                const booking = getSlotStatus(court.id, slot);
                                return (
                                    <div key={court.id} className="p-1 border-r border-slate-100 last:border-r-0 relative group">
                                        {booking ? (
                                            <div className="w-full h-full bg-indigo-600 rounded p-1 text-white shadow-sm hover:shadow-md hover:bg-indigo-700 transition-all cursor-default flex items-center overflow-hidden">
                                                <div className="font-semibold text-xs truncate flex items-center">
                                                    <span className="mr-1 opacity-75 text-[10px]">{booking.start_time.substring(0, 5)}</span>
                                                    {booking.customer_name}
                                                </div>
                                            </div>

                                        ) : (
                                            <Dialog open={openDialog && selectedSlot?.court.id === court.id && selectedSlot?.time === slot} onOpenChange={(open) => {
                                                if (open) setSelectedSlot({ court, time: slot });
                                                setOpenDialog(open);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <div className="w-full h-full rounded-lg border-2 border-dashed border-transparent hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer flex items-center justify-center">
                                                        <span className="text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform scale-95 group-hover:scale-100">
                                                            + Book
                                                        </span>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>New Booking</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid gap-6 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right text-slate-500">Court</Label>
                                                            <div className="col-span-3 font-medium text-slate-900">{court.name}</div>
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right text-slate-500">Time</Label>
                                                            <div className="col-span-3 font-medium text-slate-900">
                                                                {slot} <span className="text-slate-400 font-normal">({settings.slot_duration} min)</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right text-slate-500">Customer</Label>
                                                            <Input
                                                                placeholder="Enter customer name"
                                                                className="col-span-3"
                                                                value={customerName}
                                                                onChange={(e) => setCustomerName(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="ghost" onClick={() => setOpenDialog(false)}>Cancel</Button>
                                                        <Button onClick={handleBooking} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                            {loading ? "Booking..." : "Confirm Booking"}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
