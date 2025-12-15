import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                    <Bell className="w-5 h-5 text-slate-600" />
                </Button>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                </div>
            </div>
        </header>
    );
}
