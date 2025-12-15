import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function Courts() {
    const [courts, setCourts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [active, setActive] = useState(true);

    useEffect(() => {
        fetchCourts();
    }, []);

    const fetchCourts = async () => {
        try {
            const res = await api.get("/courts/");
            setCourts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // Payload must match CreateCourt schema: name, is_active
            const payload = { name, is_active: active };

            if (editMode && currentId) {
                await api.put(`/courts/${currentId}`, payload);
            } else {
                await api.post("/courts/", payload);
            }

            setOpen(false);
            resetForm();
            fetchCourts();
        } catch (error) {
            console.error("Failed to save court", error);
            alert("Failed to save court");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this court?")) return;
        try {
            await api.delete(`/courts/${id}`);
            fetchCourts();
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete court");
        }
    };

    const resetForm = () => {
        setName("");
        setActive(true);
        setEditMode(false);
        setCurrentId(null);
    };

    const openEdit = (court: any) => {
        // Backend returns: id, name, is_active
        setName(court.name);
        setActive(court.is_active);
        setCurrentId(court.id);
        setEditMode(true);
        setOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle>Courts Management</CardTitle>
                    <CardDescription>Manage your venue's playing courts.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4">
                            <Plus className="w-4 h-4 mr-1" /> Add Court
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editMode ? "Edit Court" : "Add New Court"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Court Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Court 1 (Wooden)"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="active">Active (Available for booking)</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={loading || !name}>
                                {loading ? "Saving..." : "Save Court"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {courts.map((court) => (
                                <tr key={court.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-500">#{court.id}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{court.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${court.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {court.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600" onClick={() => openEdit(court)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => handleDelete(court.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {courts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                        No courts added yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
