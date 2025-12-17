import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { Lock, User } from "lucide-react";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);

            const res = await api.post("/auth/token", formData);
            login(res.data.access_token);
            navigate("/");
        } catch (err: any) {
            console.error("Login error:", err);
            if (err.code === "ERR_NETWORK") {
                setError("Backend server is unreachable. Is it running?");
            } else if (err.response?.status === 401) {
                setError("Invalid username or password");
            } else {
                setError("An unexpected error occurred. Check browser console.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-slate-700 bg-slate-950/90 text-slate-100 dark">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-center tracking-tight text-white">CourtMaster</CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Enter your credentials to access the admin panel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="admin"
                                    className="pl-9 bg-slate-900 border-slate-700 focus:border-indigo-500"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9 bg-slate-900 border-slate-700 focus:border-indigo-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-950/30 border border-red-900 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold" disabled={loading}>
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
