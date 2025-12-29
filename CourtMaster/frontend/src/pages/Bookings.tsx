import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Bookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [search, setSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBookings();
        }, 500);
        return () => clearTimeout(timer);
    }, [date, search]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (date) params.date = format(date, "yyyy-MM-dd");
            if (search) params.search = search;

            const res = await api.get("/bookings/", { params });
            setBookings(res.data);
        } catch (error) {
            console.error("Failed to fetch", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const params: any = {};
            if (date) params.date = format(date, "yyyy-MM-dd");
            if (search) params.search = search;

            const response = await api.get('/reports/bookings/export', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bookings_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export Excel");
        }
    };



    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text("CourtMaster - Booking Report", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), "PPP pp")}`, 14, 30);

        if (date) {
            doc.text(`Filter Date: ${format(date, "PPP")}`, 14, 36);
        }

        // Table
        const tableColumn = ["ID", "Customer", "Mobile", "Court", "Date", "Time", "Status"];
        const tableRows: any[] = [];

        bookings.forEach(booking => {
            const bookingData = [
                booking.id,
                booking.customer_name,
                booking.mobile || "-",
                `Court ${booking.court_id}`,
                booking.date,
                `${booking.start_time} - ${booking.end_time}`,
                booking.status
            ];
            tableRows.push(bookingData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            headStyles: { fillColor: [79, 70, 229] }, // Indigo
        });

        doc.save(`bookings_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const handleCancel = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        try {
            await api.delete(`/bookings/${id}`);
            fetchBookings();
        } catch (err) {
            console.error(err);
            alert("Failed to cancel booking");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Booking Management
                </h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search name or mobile..."
                            className="pl-9 w-full sm:w-[250px] bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[200px] justify-start text-left font-normal bg-white",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Export Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleExportExcel}>
                            Excel
                        </Button>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleExportPDF}>
                            PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Court Info</TableHead>
                            <TableHead>Time Slot</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Loading bookings...
                                </TableCell>
                            </TableRow>
                        ) : bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    No bookings found for this criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bookings.map((booking) => (
                                <TableRow key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">#{booking.id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{booking.customer_name}</div>
                                        <div className="text-xs text-slate-500">{booking.mobile || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                            Court {booking.court_id}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-700">{booking.date}</div>
                                        <div className="text-xs text-slate-500">
                                            {booking.start_time} - {booking.end_time}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                            Confirmed
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleCancel(booking.id)}
                                        >
                                            Cancel
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
