import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Courts } from "./Courts";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner"; // Assuming sonner or similar is installed, usually toast provided in ui/use-toast or just alert

export function Settings() {
    const [openTime, setOpenTime] = useState("05:00");
    const [closeTime, setCloseTime] = useState("23:00");
    const [slotDuration, setSlotDuration] = useState(60);
    const [pricePerHour, setPricePerHour] = useState(400);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get("/settings/")
            .then(res => {
                if (res.data) {
                    // API returns HH:MM:SS, but input type=time wants HH:MM
                    setOpenTime(res.data.open_time.substring(0, 5));
                    setCloseTime(res.data.close_time.substring(0, 5));
                    setSlotDuration(res.data.slot_duration);
                    if (res.data.price_per_hour) setPricePerHour(res.data.price_per_hour);
                }
            })
            .catch(err => console.error("Failed to load settings", err));
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.post("/settings/", {
                open_time: openTime + ":00", // Append seconds for Pydantic Time parsing if needed
                close_time: closeTime + ":00",
                slot_duration: slotDuration,
                price_per_hour: pricePerHour
            });
            toast.success("Settings Saved Successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>

            {/* General Settings */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Configure operating hours and slot duration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Open Time</Label>
                            <Input
                                type="time"
                                value={openTime}
                                onChange={(e) => setOpenTime(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Close Time</Label>
                            <Input
                                type="time"
                                value={closeTime}
                                onChange={(e) => setCloseTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Slot Duration (minutes)</Label>
                        <div className="flex items-center space-x-4">
                            {[30, 60, 90].map(dur => (
                                <Button
                                    key={dur}
                                    variant={slotDuration === dur ? "default" : "outline"}
                                    onClick={() => setSlotDuration(dur)}
                                    className={slotDuration === dur ? "bg-slate-900 text-white" : ""}
                                >
                                    {dur} Min
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Price per 60 minutes (₹)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={pricePerHour}
                            onChange={(e) => setPricePerHour(Number(e.target.value))}
                            className="w-full max-w-[200px]"
                        />
                        <p className="text-xs text-slate-500">
                            Revenue will be calculated as: (Booking Duration / 60) × Price
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={loading} size="lg">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Courts Management */}
            <Courts />

            {/* Holidays */}
            <Card className="border-slate-200 shadow-sm opacity-60 pointer-events-none"> {/* Disabled for now or implemented later */}
                <CardHeader>
                    <CardTitle>Blocked Dates / Holidays</CardTitle>
                    <CardDescription>Select dates to block completely. (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input type="date" className="w-auto" disabled />
                        <Button disabled>Block Date</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
