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
import { CalendarIcon, Search, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function Bookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [search, setSearch] = useState("");
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [bulkDeletePeriod, setBulkDeletePeriod] = useState("weekly");
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBookings();
        }, 500);
        return () => clearTimeout(timer);
    }, [date, search]);

    useEffect(() => {
        if (bulkDeleteDialogOpen) {
            fetchYears();
        }
    }, [bulkDeleteDialogOpen]);

    const fetchYears = async () => {
        try {
            const res = await api.get("/bookings/years");
            setAvailableYears(res.data);
            if (res.data.length > 0 && !res.data.includes(selectedYear)) {
                setSelectedYear(res.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch years", error);
        }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

    const handleBulkDelete = async () => {
        if (!confirmDelete) return;

        setDeleting(true);
        try {
            const res = await api.post(`/bookings/bulk-delete`, {
                period: bulkDeletePeriod,
                year: selectedYear,
                month: selectedMonth,
                week: selectedWeek
            });
            setToast({ message: res.data.message, type: res.data.count > 0 ? 'success' : 'error' });
            setBulkDeleteDialogOpen(false);
            setConfirmDelete(false);
            fetchBookings();
        } catch (err: any) {
            console.error(err);
            setToast({ message: err.response?.data?.detail || "Failed to delete data", type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getWeeksForMonth = (year: number, month: number) => {
        const weeks = [];
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();

        for (let i = 0; i < 5; i++) {
            const start = i * 7 + 1;
            if (start > daysInMonth) break;

            let end = (i + 1) * 7;
            if (end > daysInMonth) end = daysInMonth;

            const startFormat = format(new Date(year, month - 1, start), "MMM d");
            const endFormat = format(new Date(year, month - 1, end), "MMM d");

            weeks.push({
                id: i + 1,
                label: `Week ${i + 1} (${startFormat} – ${endFormat})`
            });
        }
        return weeks;
    };

    const getConfirmationText = () => {
        if (bulkDeletePeriod === 'weekly') {
            return `Week ${selectedWeek} of ${months[selectedMonth - 1]} ${selectedYear}`;
        } else if (bulkDeletePeriod === 'monthly') {
            return `${months[selectedMonth - 1]} ${selectedYear}`;
        } else if (bulkDeletePeriod === 'yearly') {
            return `Year ${selectedYear}`;
        }
        return "";
    };

    const isDeleteDisabled = () => {
        if (!confirmDelete || deleting) return true;
        if (bulkDeletePeriod === 'weekly') return !selectedYear || !selectedMonth || !selectedWeek;
        if (bulkDeletePeriod === 'monthly') return !selectedYear || !selectedMonth;
        if (bulkDeletePeriod === 'yearly') return !selectedYear;
        return true;
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
                        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 p-2">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Clear Bookings Data</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 pt-4">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-700">Select Period</Label>
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { id: 'weekly', label: 'Delete Weekly Bookings' },
                                                { id: 'monthly', label: 'Delete Monthly Bookings' },
                                                { id: 'yearly', label: 'Delete Yearly Bookings' }
                                            ].map((p) => (
                                                <div key={p.id} className="space-y-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setBulkDeletePeriod(p.id)}
                                                        className={cn(
                                                            "w-full justify-start h-12 px-4 border transition-all",
                                                            bulkDeletePeriod === p.id
                                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm"
                                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border flex items-center justify-center mr-3",
                                                            bulkDeletePeriod === p.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                                                        )}>
                                                            {bulkDeletePeriod === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="font-medium text-sm">{p.label}</span>
                                                    </Button>

                                                    {bulkDeletePeriod === p.id && (
                                                        <div className="grid grid-cols-2 gap-3 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {p.id === 'yearly' && (
                                                                <div className="col-span-2 space-y-1.5">
                                                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Select Year</Label>
                                                                    <select
                                                                        value={selectedYear}
                                                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 shadow-sm hover:border-slate-300"
                                                                    >
                                                                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                                    </select>
                                                                </div>
                                                            )}
                                                            {p.id === 'monthly' && (
                                                                <>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Select Year</Label>
                                                                        <select
                                                                            value={selectedYear}
                                                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 shadow-sm hover:border-slate-300"
                                                                        >
                                                                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Select Month</Label>
                                                                        <select
                                                                            value={selectedMonth}
                                                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 shadow-sm hover:border-slate-300"
                                                                        >
                                                                            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {p.id === 'weekly' && (
                                                                <>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Select Month</Label>
                                                                        <select
                                                                            value={selectedMonth}
                                                                            onChange={(e) => {
                                                                                setSelectedMonth(parseInt(e.target.value));
                                                                                setSelectedWeek(1);
                                                                            }}
                                                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 shadow-sm hover:border-slate-300"
                                                                        >
                                                                            {months.map((m, i) => <option key={m} value={i + 1}>{m} {selectedYear}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Select Week</Label>
                                                                        <select
                                                                            value={selectedWeek}
                                                                            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                                                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 shadow-sm hover:border-slate-300"
                                                                        >
                                                                            {getWeeksForMonth(selectedYear, selectedMonth).map(w => (
                                                                                <option key={w.id} value={w.id}>{w.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <p className="col-span-2 text-[10px] text-slate-400 font-medium italic mt-1">
                                                                * Only data from {getConfirmationText()} will be deleted
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500 mb-2 font-medium">Auto-included scopes:</p>
                                        <div className="flex gap-2">
                                            {['Booking', 'Coaching', 'Event'].map(scope => (
                                                <span key={scope} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600">
                                                    {scope}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="flex items-center pt-0.5">
                                            <input
                                                type="checkbox"
                                                id="confirm"
                                                checked={confirmDelete}
                                                onChange={(e) => setConfirmDelete(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                            />
                                        </div>
                                        <Label htmlFor="confirm" className="text-xs text-slate-600 leading-relaxed cursor-pointer font-normal">
                                            I understand this action will permanently delete the selected booking, coaching, and event data for <span className="font-bold text-slate-900">{getConfirmationText()}</span>.
                                        </Label>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-2">
                                        <Button variant="ghost" onClick={() => setBulkDeleteDialogOpen(false)} disabled={deleting}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleBulkDelete}
                                            disabled={isDeleteDisabled()}
                                            className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                                        >
                                            {deleting ? "Deleting..." : "Permanently Delete"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
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
                            <TableHead>Mobile Number</TableHead>
                            <TableHead>Court Info</TableHead>
                            <TableHead>Time Slot</TableHead>
                            <TableHead>Category</TableHead>
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
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-600 font-medium">{booking.mobile || "—"}</div>
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
                                        <span className={cn(
                                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize",
                                            (booking.category === 'coaching') ? "bg-sky-50 text-sky-700 ring-sky-700/10" :
                                                (booking.category === 'event') ? "bg-orange-50 text-orange-700 ring-orange-700/10" :
                                                    "bg-purple-50 text-purple-700 ring-purple-700/10"
                                        )}>
                                            {booking.category || 'booking'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 capitalize">
                                            {booking.status}
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

            {/* Custom Toast */}
            {toast && (
                <div className={cn(
                    "fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in fade-in slide-in-from-bottom-5 duration-300 z-50",
                    toast.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                )}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Trash2 className="h-5 w-5 text-red-500" />}
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            )}
        </div>
    );
}
