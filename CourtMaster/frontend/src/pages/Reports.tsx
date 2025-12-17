import { useState, useEffect } from "react";
import { format, subDays, addDays } from "date-fns";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Reports() {
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [startDate] = useState(subDays(new Date(), 7));
    const [endDate] = useState(new Date());

    useEffect(() => {
        fetchHeatmap();
    }, [startDate, endDate]);

    const fetchHeatmap = async () => {
        try {
            const res = await api.get("/reports/capacity", {
                params: {
                    start_date: format(startDate, "yyyy-MM-dd"),
                    end_date: format(endDate, "yyyy-MM-dd")
                }
            });
            setHeatmapData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Transform data for grid: keys = date, values = { court_id: booked_hours }
    // Actually simplicity: We need a matrix. Rows = Courts, Cols = Dates.
    const dates: string[] = [];
    let d = startDate;
    while (d <= endDate) {
        dates.push(format(d, "yyyy-MM-dd"));
        d = addDays(d, 1);
    }

    const courts = [1, 2, 3]; // From mock or api

    const getIntensity = (date: string, courtId: number) => {
        const entry = heatmapData.find((h: any) => h.date === date && h.court_id === courtId);
        const hours = entry ? entry.booked_hours : 0;
        // Assume max 12 hours
        if (hours === 0) return "bg-emerald-50";
        if (hours < 4) return "bg-emerald-200";
        if (hours < 8) return "bg-yellow-200";
        return "bg-red-400 text-white";
    };

    const getValue = (date: string, courtId: number) => {
        const entry = heatmapData.find((h: any) => h.date === date && h.court_id === courtId);
        return entry ? `${entry.booked_hours}h` : "-";
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Capacity Reports
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>Court Utilization Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto pb-4">
                        <div className="min-w-[600px]">
                            {/* Header (Dates) */}
                            <div className="flex">
                                <div className="w-24 flex-shrink-0 p-2 font-bold text-slate-500">Court</div>
                                {dates.map(date => (
                                    <div key={date} className="w-16 flex-shrink-0 p-2 text-xs text-center font-medium text-slate-500 border-l">
                                        {format(new Date(date), "MMM dd")}
                                    </div>
                                ))}
                            </div>

                            {/* Rows (Courts) */}
                            {courts.map(courtId => (
                                <div key={courtId} className="flex border-t">
                                    <div className="w-24 flex-shrink-0 p-3 font-medium text-slate-700 bg-slate-50">
                                        Court {courtId}
                                    </div>
                                    {dates.map(date => (
                                        <div
                                            key={`${date}-${courtId}`}
                                            className={`w-16 flex-shrink-0 p-3 text-xs text-center border-l font-medium transition-colors cursor-default ${getIntensity(date, courtId)}`}
                                            title={`Court ${courtId} on ${date}: ${getValue(date, courtId)} booked`}
                                        >
                                            {getValue(date, courtId)}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 text-xs text-slate-500">
                        <span className="flex items-center"><span className="w-3 h-3 bg-emerald-50 mr-1 border"></span> Empty</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-emerald-200 mr-1"></span> Low</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-yellow-200 mr-1"></span> Med</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-red-400 mr-1"></span> High</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
