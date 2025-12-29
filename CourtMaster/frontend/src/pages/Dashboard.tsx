import { useState, useEffect } from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, DollarSign, CalendarCheck } from "lucide-react";

export function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [charts, setCharts] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [revenuePeriod, setRevenuePeriod] = useState("overall");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats with selected period
                const statsRes = await api.get("/reports/dashboard/stats", {
                    params: { period: revenuePeriod }
                });

                // Fetch charts (only once or separate if needed, but for now keeping together loosely or separate)
                // To avoid flickering, we can separate them. 
                // But simplified:

                if (!charts) {
                    const chartsRes = await api.get("/reports/dashboard/charts");
                    setCharts(chartsRes.data);
                }

                setStats(statsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [revenuePeriod]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Dashboard Overview
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Bookings</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.total_bookings}</div>
                        <p className="text-xs text-slate-500">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div className="text-2xl font-bold text-slate-900">₹{stats?.revenue.toLocaleString()}</div>

                            {/* Revenue Tabs */}
                            <div className="flex bg-slate-100 p-1 rounded-md w-fit">
                                {["today", "week", "month", "year", "overall"].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setRevenuePeriod(period)}
                                        className={`px-2 py-1 text-[10px] font-medium rounded-sm transition-all capitalize ${revenuePeriod === period
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        {period === "overall" ? "All" : period}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Active Customers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.active_customers}</div>
                        <p className="text-xs text-slate-500">+2 New this week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle>Daily Bookings Trend</CardTitle>
                        <CardDescription>Bookings over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {charts?.daily && charts.daily.length > 0 ? (
                                <LineChart data={charts.daily}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    No booking data available
                                </div>
                            )}
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle>Booking Status Distribution</CardTitle>
                        <CardDescription>Breakdown of current booking statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {charts?.status && charts.status.length > 0 ? (
                                <PieChart>
                                    <Pie
                                        data={charts?.status}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {charts?.status.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    No status data available
                                </div>
                            )}
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
