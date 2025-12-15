import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Settings, Users, BarChart3, Trophy } from "lucide-react";

export function Sidebar() {
    const location = useLocation();

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Bookings", href: "/bookings", icon: Users },
        { name: "Reports", href: "/reports", icon: BarChart3 },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="h-screen w-56 bg-slate-900 text-white flex flex-col transition-all duration-300">
            <div className="p-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-indigo-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
                    Venue Manager
                </h1>
            </div>
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                            "flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-sm",
                            location.pathname === item.href
                                ? "bg-indigo-600 text-white shadow shadow-indigo-900/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <item.icon className={cn(
                            "w-4 h-4 transition-colors",
                            location.pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-white"
                        )} />
                        <span className="font-medium">{item.name}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-3 border-t border-slate-800">
                <div className="text-xs text-slate-500 text-center">
                    v1.0.0
                </div>
            </div>
        </div>
    );
}
