"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Room, WindowMeasurement, MountType, OpeningDirection, ProductType, MotorType } from "@/types/measurement";
import {
    Plus,
    Trash2,
    AlertCircle,
    Copy,
    Sparkles,
    Check,
    Layers,
    ChevronDown,
    ChevronUp,
    Ruler,
    Edit3,
    ArrowDownToLine
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { Badge } from "@/components/ui/badge";
import { MeasuringTapeInput } from "@/components/ui/measuring-tape";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WindowMeasurementStepProps {
    rooms: Room[];
    setRooms: (rooms: Room[]) => void;
    onNext: () => void;
    onBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

const FABRICS = [
    { id: "F001", name: "Silk Sheer - Ivory", price: 45 },
    { id: "F002", name: "Blackout Premium - Charcoal", price: 65 },
    { id: "F003", name: "Linen Blend - Beige", price: 55 },
    { id: "F004", name: "Velvet Luxury - Navy", price: 85 },
    { id: "F005", name: "Cotton Light - White", price: 40 },
];

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

export function WindowMeasurementStep({
    rooms,
    setRooms,
    onNext,
    onBack,
}: WindowMeasurementStepProps) {
    const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || "");
    const [editingWindow, setEditingWindow] = useState<string | null>(rooms[0]?.windows[0]?.id || null);
    const [measurementUnit, setMeasurementUnit] = useState<"cm" | "in">("cm");

    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

    const getFabricLabel = (window: WindowMeasurement): string => {
        if (window.fabricSelection === "Custom") {
            return window.customFabricName ? `Custom: ${window.customFabricName}` : "Custom Fabric";
        }
        const found = FABRICS.find((f) => f.id === window.fabricSelection);
        return found ? found.name : (window.fabricSelection || "No fabric");
    };

    const allWindowsCount = rooms.reduce((sum, r) => sum + r.windows.length, 0);

    const addWindow = () => {
        if (!selectedRoom) return;

        let maxNum = 0;
        selectedRoom.windows.forEach((w) => {
            const m = w.name.match(/^Window\s+(\d+)$/i);
            if (m) {
                const n = parseInt(m[1], 10);
                if (n > maxNum) maxNum = n;
            }
        });
        const newName = `Window ${Math.max(maxNum + 1, selectedRoom.windows.length + 1)}`;

        const lastWindow = selectedRoom.windows[selectedRoom.windows.length - 1]
            || rooms.flatMap(r => r.windows).slice(-1)[0];

        const newWindow: WindowMeasurement = {
            id: uuidv4(),
            name: newName,
            width: lastWindow?.width ?? 150,
            height: lastWindow?.height ?? 200,
            mountType: lastWindow?.mountType ?? "Wall",
            openingDirection: lastWindow?.openingDirection ?? "Split",
            productType: lastWindow?.productType ?? "Sheer Curtains",
            customProductName: lastWindow?.customProductName,
            fabricSelection: lastWindow?.fabricSelection ?? "F001",
            customFabricName: lastWindow?.customFabricName,
            motorType: lastWindow?.motorType ?? "Manual",
        };

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: [...room.windows, newWindow] }
                : room
        );
        setRooms(updatedRooms);
        setEditingWindow(newWindow.id);
        toast.success(`Added ${newName}`);
    };

    const duplicateWindow = (windowId: string) => {
        if (!selectedRoom) return;
        const sourceWindow = selectedRoom.windows.find((w) => w.id === windowId);
        if (!sourceWindow) return;

        let maxNum = 0;
        selectedRoom.windows.forEach((w) => {
            const m = w.name.match(/^Window\s+(\d+)$/i);
            if (m) {
                const n = parseInt(m[1], 10);
                if (n > maxNum) maxNum = n;
            }
        });
        const newName = sourceWindow.name.match(/^Window\s+\d+$/i)
            ? `Window ${maxNum + 1}`
            : `${sourceWindow.name} (Copy)`;

        const clonedWindow: WindowMeasurement = {
            ...sourceWindow,
            id: uuidv4(),
            name: newName,
        };

        const sourceIndex = selectedRoom.windows.findIndex((w) => w.id === windowId);
        const newWindows = [...selectedRoom.windows];
        newWindows.splice(sourceIndex + 1, 0, clonedWindow);

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId ? { ...room, windows: newWindows } : room
        );
        setRooms(updatedRooms);
        setEditingWindow(clonedWindow.id);
        toast.success(`Duplicated "${sourceWindow.name}" as "${newName}"`);
    };

    const copyFromAnyWindow = (
        targetWindowId: string,
        sourceRoomId: string,
        sourceWindowId: string
    ) => {
        const sourceRoom = rooms.find((r) => r.id === sourceRoomId);
        const source = sourceRoom?.windows.find((w) => w.id === sourceWindowId);
        if (!source || !sourceRoom) return;

        const updates: Partial<WindowMeasurement> = {
            width: source.width,
            height: source.height,
            mountType: source.mountType,
            openingDirection: source.openingDirection,
            productType: source.productType,
            customProductName: source.customProductName,
            fabricSelection: source.fabricSelection,
            customFabricName: source.customFabricName,
            motorType: source.motorType,
            notes: source.notes,
        };

        updateWindow(targetWindowId, updates);
        toast.success(
            `Copied ${source.width}×${source.height}cm & ${source.productType} from "${sourceRoom.name} > ${source.name}"`
        );
    };

    const importWindowFromOtherRoom = (sourceRoomId: string, sourceWindowId: string) => {
        if (!selectedRoom) return;
        const sourceRoom = rooms.find((r) => r.id === sourceRoomId);
        const source = sourceRoom?.windows.find((w) => w.id === sourceWindowId);
        if (!source || !sourceRoom) return;

        let maxNum = 0;
        selectedRoom.windows.forEach((w) => {
            const m = w.name.match(/^Window\s+(\d+)$/i);
            if (m) {
                const n = parseInt(m[1], 10);
                if (n > maxNum) maxNum = n;
            }
        });
        const newName = `Window ${Math.max(maxNum + 1, selectedRoom.windows.length + 1)}`;

        const newWindow: WindowMeasurement = {
            ...source,
            id: uuidv4(),
            name: newName,
        };

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: [...room.windows, newWindow] }
                : room
        );
        setRooms(updatedRooms);
        setEditingWindow(newWindow.id);
        toast.success(
            `Added ${newName} (${source.width}×${source.height}cm) copied from "${sourceRoom.name} > ${source.name}"`
        );
    };

    const applySpecsToAllInRoom = (sourceWindow: WindowMeasurement) => {
        if (!selectedRoom) return;
        if (selectedRoom.windows.length <= 1) {
            toast.info("Add more windows to this room to use this feature.");
            return;
        }

        const updatedWindows = selectedRoom.windows.map((w) => {
            if (w.id === sourceWindow.id) return w;
            return {
                ...w,
                mountType: sourceWindow.mountType,
                openingDirection: sourceWindow.openingDirection,
                productType: sourceWindow.productType,
                customProductName: sourceWindow.customProductName,
                fabricSelection: sourceWindow.fabricSelection,
                customFabricName: sourceWindow.customFabricName,
                motorType: sourceWindow.motorType,
            };
        });

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId ? { ...room, windows: updatedWindows } : room
        );
        setRooms(updatedRooms);
        toast.success(`Applied product, mount & fabric to all windows in ${selectedRoom.name}!`);
    };

    const addCustomItem = () => {
        if (!selectedRoom) return;

        const newWindow: WindowMeasurement = {
            id: uuidv4(),
            name: `Custom Item ${selectedRoom.windows.length + 1}`,
            width: 150,
            height: 200,
            mountType: "Wall",
            openingDirection: "Split",
            productType: "Custom Item",
            customProductName: "Custom Item",
            motorType: "Manual",
            fabricSelection: "None",
        };

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: [...room.windows, newWindow] }
                : room
        );
        setRooms(updatedRooms);
        setEditingWindow(newWindow.id);
        toast.success("Added Custom Item");
    };

    const updateWindow = (windowId: string, updates: Partial<WindowMeasurement>) => {
        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? {
                    ...room,
                    windows: room.windows.map((w) =>
                        w.id === windowId ? { ...w, ...updates } : w
                    ),
                }
                : room
        );
        setRooms(updatedRooms);
    };

    const adjustDimension = (windowId: string, dimension: 'width' | 'height', delta: number) => {
        const win = selectedRoom?.windows.find(w => w.id === windowId);
        if (!win) return;
        const currentVal = win[dimension];
        const stepDelta = measurementUnit === "cm" ? delta : delta * 2.54;
        const newVal = Math.max(10, round2(currentVal + stepDelta));
        updateWindow(windowId, { [dimension]: newVal });
    };

    const deleteWindow = (windowId: string) => {
        const win = selectedRoom?.windows.find((w) => w.id === windowId);
        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: room.windows.filter((w) => w.id !== windowId) }
                : room
        );
        setRooms(updatedRooms);
        if (editingWindow === windowId) {
            setEditingWindow(null);
        }
        if (win) {
            toast.info(`Removed "${win.name}"`);
        }
    };

    const scrollToTop = () => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            document.documentElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            document.body?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }
    };

    const handleNext = () => {
        if (rooms.length === 0) {
            toast.error("Please add at least one room first.");
            return;
        }

        const emptyRooms = rooms.filter(room => room.windows.length === 0);
        if (emptyRooms.length > 0) {
            toast.error(`Rooms with no items: ${emptyRooms.map(r => r.name).join(", ")}. Please add items or remove empty rooms.`);
            return;
        }

        scrollToTop();
        onNext();
    };

    const handleBack = () => {
        scrollToTop();
        onBack();
    };

    return (
        <div className="space-y-2.5 sm:space-y-4">
            {/* Step Header with Global Unit Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 sm:pb-3">
                <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
                        Window Measurements
                    </h2>
                    <p className="text-[11px] sm:text-sm text-stone-500 dark:text-stone-400">
                        Interactive measuring scale. Duplicate or copy from any room (e.g. Room 1 → Room 3).
                    </p>
                </div>

                {/* Global CM / Inch Toggle */}
                <div className="flex items-center gap-1 self-start sm:self-auto bg-stone-100 dark:bg-stone-800/80 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 pl-1.5 pr-0.5">Unit:</span>
                    <button
                        type="button"
                        onClick={() => setMeasurementUnit("cm")}
                        className={cn(
                            "px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-md sm:rounded-lg transition-all cursor-pointer",
                            measurementUnit === "cm"
                                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs"
                                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                        )}
                    >
                        CM
                    </button>
                    <button
                        type="button"
                        onClick={() => setMeasurementUnit("in")}
                        className={cn(
                            "px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-md sm:rounded-lg transition-all cursor-pointer",
                            measurementUnit === "in"
                                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs"
                                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                        )}
                    >
                        Inch
                    </button>
                </div>
            </div>

            {/* Room Tabs */}
            <Tabs value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-stone-100/80 dark:bg-stone-800/50 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-700/60 gap-0.5 sm:gap-1">
                    {rooms.map((room) => (
                        <TabsTrigger
                            key={room.id}
                            value={room.id}
                            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-stone-900 data-[state=active]:shadow-xs transition-all cursor-pointer"
                        >
                            {room.name}
                            <Badge
                                variant="secondary"
                                className="ml-1 sm:ml-1.5 h-4 px-1 text-[10px] sm:text-[11px] font-semibold bg-stone-200 dark:bg-stone-800"
                            >
                                {room.windows.length}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {rooms.map((room) => {
                    const windowsInOtherRooms = rooms
                        .filter((r) => r.id !== room.id)
                        .flatMap((r) => r.windows.map((w) => ({ ...w, roomName: r.name, roomId: r.id })));

                    return (
                        <TabsContent key={room.id} value={room.id} className="space-y-2.5 sm:space-y-3.5 mt-2.5 sm:mt-4">
                            {/* Action Toolbar for Room - Compact on mobile */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 bg-stone-50 dark:bg-stone-900/40 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-stone-200/80 dark:border-stone-800">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-white">
                                        {room.name}
                                    </h3>
                                    <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                                        • {room.windows.length} {room.windows.length === 1 ? "opening" : "openings"}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                    {/* Cross-Room Quick Import Button (e.g. Copy Room 1's window into Room 3) */}
                                    {windowsInOtherRooms.length > 0 && (
                                        <Select
                                            onValueChange={(val) => {
                                                const [sRoomId, sWinId] = val.split("::");
                                                importWindowFromOtherRoom(sRoomId, sWinId);
                                            }}
                                        >
                                            <SelectTrigger className="h-7 sm:h-8 text-xs border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 font-medium cursor-pointer max-w-[180px] sm:max-w-[200px] truncate">
                                                <ArrowDownToLine className="w-3.5 h-3.5 mr-1 shrink-0" />
                                                <SelectValue placeholder="Copy from Room..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                {rooms
                                                    .filter((r) => r.id !== room.id && r.windows.length > 0)
                                                    .map((r) => (
                                                        <div key={r.id} className="py-1">
                                                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/70">
                                                                {r.name}
                                                            </div>
                                                            {r.windows.map((w) => {
                                                                const dispW = measurementUnit === "cm" ? round2(w.width) : round2(w.width / 2.54);
                                                                const dispH = measurementUnit === "cm" ? round2(w.height) : round2(w.height / 2.54);
                                                                return (
                                                                    <SelectItem
                                                                        key={`${r.id}::${w.id}`}
                                                                        value={`${r.id}::${w.id}`}
                                                                        className="text-xs cursor-pointer pl-4"
                                                                    >
                                                                        <span className="font-semibold">{w.name}</span>
                                                                        <span className="text-stone-500 ml-1.5">
                                                                            ({dispW}×{dispH} {measurementUnit} • {w.productType})
                                                                        </span>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Button
                                        onClick={addWindow}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 sm:h-8 text-xs px-2 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                        Add Window
                                    </Button>

                                    <Button
                                        onClick={addCustomItem}
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 sm:h-8 text-xs px-2 font-medium bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                        Custom Item
                                    </Button>
                                </div>
                            </div>

                            {room.windows.length === 0 ? (
                                <Card className="p-8 sm:p-12 text-center border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-xl sm:rounded-2xl">
                                    <div className="max-w-md mx-auto space-y-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500">
                                            <Ruler className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <h4 className="font-semibold text-stone-900 dark:text-white text-sm sm:text-base">No windows in {room.name} yet</h4>
                                        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                                            {windowsInOtherRooms.length > 0
                                                ? `You can copy an existing window from another room or click "Add Window".`
                                                : "Click 'Add Window' to measure the first window."}
                                        </p>
                                        <div className="flex justify-center gap-2 pt-1">
                                            <Button onClick={addWindow} size="sm" className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 cursor-pointer">
                                                <Plus className="w-4 h-4 mr-1.5" />
                                                Add First Window
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {room.windows.map((window) => {
                                        const isEditing = editingWindow === window.id;
                                        const displayWidth = measurementUnit === "cm" ? round2(window.width) : round2(window.width / 2.54);
                                        const displayHeight = measurementUnit === "cm" ? round2(window.height) : round2(window.height / 2.54);
                                        const fabricLabel = getFabricLabel(window);

                                        return (
                                            <Card
                                                key={window.id}
                                                className={cn(
                                                    "overflow-hidden rounded-xl sm:rounded-2xl transition-all border p-0 py-0 gap-0",
                                                    isEditing
                                                        ? "ring-1 ring-stone-900/15 dark:ring-white/20 border-stone-300 dark:border-stone-700 shadow-sm"
                                                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-xs"
                                                )}
                                            >
                                                {/* Window Header */}
                                                <CardHeader
                                                    className="cursor-pointer select-none p-2 sm:p-3.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-stone-900 transition-colors"
                                                    onClick={() => setEditingWindow(isEditing ? null : window.id)}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                                                        <div className="space-y-0.5 sm:space-y-1">
                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                <CardTitle className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                                                                    {window.name}
                                                                </CardTitle>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-semibold text-[10px] sm:text-xs border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 py-0 px-1.5 h-4 sm:h-5"
                                                                >
                                                                    {displayWidth} × {displayHeight} {measurementUnit}
                                                                </Badge>
                                                            </div>

                                                            {/* Summary Badges Row */}
                                                            <div className="flex flex-wrap items-center gap-1 text-[10px] text-stone-600 dark:text-stone-400">
                                                                <Badge variant="secondary" className="font-normal text-[10px] py-0 px-1.5 h-4.5">
                                                                    {window.productType}
                                                                </Badge>
                                                                <Badge variant="outline" className="font-normal text-[10px] py-0 px-1.5 h-4.5">
                                                                    {window.mountType} Mount
                                                                </Badge>
                                                                <Badge variant="outline" className="font-normal text-[10px] py-0 px-1.5 h-4.5">
                                                                    {window.openingDirection}
                                                                </Badge>
                                                                <Badge variant="outline" className="font-normal text-[10px] py-0 px-1.5 h-4.5">
                                                                    {window.motorType}
                                                                </Badge>
                                                                {fabricLabel !== "No fabric" && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="font-normal text-[10px] py-0 px-1.5 h-4.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 dark:border-indigo-900 dark:text-indigo-300 dark:bg-indigo-950/40"
                                                                    >
                                                                        {fabricLabel}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Header Action Buttons */}
                                                        <div className="flex items-center gap-1 self-end sm:self-center pt-0.5 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => duplicateWindow(window.id)}
                                                                className="h-7 px-2 text-xs border-indigo-200 hover:border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 font-medium cursor-pointer"
                                                                title="Create an exact copy of this window"
                                                            >
                                                                <Copy className="w-3 h-3 mr-1" />
                                                                <span>Duplicate</span>
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant={isEditing ? "default" : "secondary"}
                                                                size="sm"
                                                                onClick={() => setEditingWindow(isEditing ? null : window.id)}
                                                                className={cn(
                                                                    "h-7 px-2 text-xs font-medium cursor-pointer",
                                                                    isEditing
                                                                        ? "bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900"
                                                                        : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                                )}
                                                            >
                                                                {isEditing ? (
                                                                    <>
                                                                        <Check className="w-3 h-3 mr-1 text-emerald-400" />
                                                                        Done
                                                                        <ChevronUp className="w-3 h-3 ml-0.5" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Edit3 className="w-3 h-3 mr-1" />
                                                                        Edit
                                                                        <ChevronDown className="w-3 h-3 ml-0.5" />
                                                                    </>
                                                                )}
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deleteWindow(window.id)}
                                                                className="h-7 w-7 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                                                title="Delete window"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                {/* Expanded Edit Form - SQUEEZED AND CLEAN ON MOBILE */}
                                                {isEditing && (
                                                    <CardContent className="pt-2 pb-3 px-2 sm:pt-3 sm:pb-4 sm:px-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 space-y-2.5 sm:space-y-3.5">
                                                        {/* Quick Copy Strip: Low-profile, no heavy inner card */}
                                                        {allWindowsCount > 1 && (
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1 px-1 text-xs">
                                                                <div className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
                                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                                    <span>Copy specs from:</span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <Select
                                                                        onValueChange={(selectedVal) => {
                                                                            const [sRoomId, sWinId] = selectedVal.split("::");
                                                                            copyFromAnyWindow(window.id, sRoomId, sWinId);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-7.5 sm:h-8 text-xs w-full sm:w-auto sm:min-w-[200px] bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 cursor-pointer">
                                                                            <Copy className="w-3 h-3 mr-1 text-indigo-600 shrink-0" />
                                                                            <SelectValue placeholder="Select window..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="max-h-72">
                                                                            {rooms.map((r) => {
                                                                                const roomWins = r.windows.filter((w) => !(r.id === room.id && w.id === window.id));
                                                                                if (roomWins.length === 0) return null;
                                                                                return (
                                                                                    <div key={r.id} className="py-1">
                                                                                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/80">
                                                                                            {r.name} {r.id === room.id ? "(Current Room)" : ""}
                                                                                        </div>
                                                                                        {roomWins.map((other) => {
                                                                                            const otherW = measurementUnit === "cm" ? round2(other.width) : round2(other.width / 2.54);
                                                                                            const otherH = measurementUnit === "cm" ? round2(other.height) : round2(other.height / 2.54);
                                                                                            return (
                                                                                                <SelectItem
                                                                                                    key={`${r.id}::${other.id}`}
                                                                                                    value={`${r.id}::${other.id}`}
                                                                                                    className="text-xs cursor-pointer pl-4"
                                                                                                >
                                                                                                    <span className="font-semibold text-stone-900 dark:text-white">{other.name}</span>
                                                                                                    <span className="text-stone-500 ml-1.5">
                                                                                                        ({otherW}×{otherH} {measurementUnit} • {other.productType})
                                                                                                    </span>
                                                                                                </SelectItem>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {room.windows.length > 1 && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => applySpecsToAllInRoom(window)}
                                                                            className="h-7.5 text-[11px] text-stone-600 hover:text-stone-900 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer px-2"
                                                                            title="Apply this window's product type, mount, and fabric to all windows in this room"
                                                                        >
                                                                            <Layers className="w-3 h-3 mr-1 text-stone-500" />
                                                                            Apply to all in {room.name}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Window Name Inline Edit */}
                                                        <div className="space-y-1">
                                                            <Label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                                                Window / Opening Name
                                                            </Label>
                                                            <Input
                                                                value={window.name}
                                                                onChange={(e) => updateWindow(window.id, { name: e.target.value })}
                                                                placeholder="e.g. Window 1, Bay Left, Balcony Door..."
                                                                className="h-8.5 sm:h-9 bg-stone-50/50 dark:bg-stone-800 text-sm font-semibold max-w-sm"
                                                            />
                                                        </div>

                                                        {/* Dimensions Section - DIRECT LAYOUT WITHOUT INNER BOX TO SAVE SPACE */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                                                            {/* Width Scale & Controls */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                                                                        Width ({measurementUnit})
                                                                    </Label>
                                                                    <span className="text-xs text-stone-500 font-bold">
                                                                        {displayWidth} {measurementUnit}
                                                                    </span>
                                                                </div>

                                                                {/* Visual Measuring Scale Tape */}
                                                                <MeasuringTapeInput
                                                                    value={measurementUnit === "cm" ? round2(window.width) : round2(window.width / 2.54)}
                                                                    onChange={(value) =>
                                                                        updateWindow(window.id, {
                                                                            width: measurementUnit === "cm" ? round2(value) : round2(value * 2.54),
                                                                        })
                                                                    }
                                                                    min={measurementUnit === "cm" ? 20 : 10}
                                                                    max={measurementUnit === "cm" ? 600 : 240}
                                                                    step={measurementUnit === "cm" ? 1 : 0.5}
                                                                    unit={measurementUnit}
                                                                />

                                                                {/* Stepper Buttons + Unclipped Numeric Input */}
                                                                <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full pt-0.5">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "width", -10)}
                                                                        className="h-8.5 w-8.5 sm:h-9 sm:w-10 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Subtract 10"
                                                                    >
                                                                        -10
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "width", -5)}
                                                                        className="h-8.5 w-8 sm:h-9 sm:w-9 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Subtract 5"
                                                                    >
                                                                        -5
                                                                    </Button>

                                                                    <div className="flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white focus-within:ring-1 focus-within:ring-stone-900 dark:focus-within:ring-white rounded-lg px-2 h-8.5 sm:h-9 flex-1 min-w-[95px] max-w-[140px] shadow-2xs">
                                                                        <input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={measurementUnit === "cm" ? (window.width ? round2(window.width) : "") : (window.width ? round2(window.width / 2.54) : "")}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                                                if (!isNaN(val)) {
                                                                                    updateWindow(window.id, {
                                                                                        width: measurementUnit === "cm" ? round2(val) : round2(val * 2.54),
                                                                                    });
                                                                                }
                                                                            }}
                                                                            onFocus={(e) => (e.target as HTMLInputElement).select()}
                                                                            className="w-full text-center font-bold text-base sm:text-lg text-stone-900 dark:text-white bg-transparent outline-hidden border-0 p-0"
                                                                        />
                                                                        <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase ml-1 shrink-0 select-none">
                                                                            {measurementUnit}
                                                                        </span>
                                                                    </div>

                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "width", 5)}
                                                                        className="h-8.5 w-8 sm:h-9 sm:w-9 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Add 5"
                                                                    >
                                                                        +5
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "width", 10)}
                                                                        className="h-8.5 w-8.5 sm:h-9 sm:w-10 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Add 10"
                                                                    >
                                                                        +10
                                                                    </Button>
                                                                </div>

                                                                {(window.width < 40 || window.width > 500) && (
                                                                    <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 text-xs">
                                                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                                        <span>Noticeable dimension. Please double-check tape reading.</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Height Scale & Controls */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                                                                        Height ({measurementUnit})
                                                                    </Label>
                                                                    <span className="text-xs text-stone-500 font-bold">
                                                                        {displayHeight} {measurementUnit}
                                                                    </span>
                                                                </div>

                                                                {/* Visual Measuring Scale Tape */}
                                                                <MeasuringTapeInput
                                                                    value={measurementUnit === "cm" ? round2(window.height) : round2(window.height / 2.54)}
                                                                    onChange={(value) =>
                                                                        updateWindow(window.id, {
                                                                            height: measurementUnit === "cm" ? round2(value) : round2(value * 2.54),
                                                                        })
                                                                    }
                                                                    min={measurementUnit === "cm" ? 30 : 12}
                                                                    max={measurementUnit === "cm" ? 600 : 240}
                                                                    step={measurementUnit === "cm" ? 1 : 0.5}
                                                                    unit={measurementUnit}
                                                                />

                                                                {/* Stepper Buttons + Unclipped Numeric Input */}
                                                                <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full pt-0.5">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "height", -10)}
                                                                        className="h-8.5 w-8.5 sm:h-9 sm:w-10 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Subtract 10"
                                                                    >
                                                                        -10
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "height", -5)}
                                                                        className="h-8.5 w-8 sm:h-9 sm:w-9 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Subtract 5"
                                                                    >
                                                                        -5
                                                                    </Button>

                                                                    <div className="flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white focus-within:ring-1 focus-within:ring-stone-900 dark:focus-within:ring-white rounded-lg px-2 h-8.5 sm:h-9 flex-1 min-w-[95px] max-w-[140px] shadow-2xs">
                                                                        <input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={measurementUnit === "cm" ? (window.height ? round2(window.height) : "") : (window.height ? round2(window.height / 2.54) : "")}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                                                if (!isNaN(val)) {
                                                                                    updateWindow(window.id, {
                                                                                        height: measurementUnit === "cm" ? round2(val) : round2(val * 2.54),
                                                                                    });
                                                                                }
                                                                            }}
                                                                            onFocus={(e) => (e.target as HTMLInputElement).select()}
                                                                            className="w-full text-center font-bold text-base sm:text-lg text-stone-900 dark:text-white bg-transparent outline-hidden border-0 p-0"
                                                                        />
                                                                        <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase ml-1 shrink-0 select-none">
                                                                            {measurementUnit}
                                                                        </span>
                                                                    </div>

                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "height", 5)}
                                                                        className="h-8.5 w-8 sm:h-9 sm:w-9 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Add 5"
                                                                    >
                                                                        +5
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => adjustDimension(window.id, "height", 10)}
                                                                        className="h-8.5 w-8.5 sm:h-9 sm:w-10 p-0 text-xs font-semibold text-stone-600 dark:text-stone-300 rounded-lg shrink-0 cursor-pointer"
                                                                        title="Add 10"
                                                                    >
                                                                        +10
                                                                    </Button>
                                                                </div>

                                                                {(window.height < 40 || window.height > 500) && (
                                                                    <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 text-xs">
                                                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                                        <span>Noticeable height. Please double-check tape reading.</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Options & Hardware Grid - 2 columns on mobile, 4 on desktop */}
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Mount Type
                                                                </Label>
                                                                <Select
                                                                    value={window.mountType}
                                                                    onValueChange={(value: MountType) => updateWindow(window.id, { mountType: value })}
                                                                >
                                                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-stone-900 cursor-pointer">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Wall" className="cursor-pointer">Wall Mount</SelectItem>
                                                                        <SelectItem value="Ceiling" className="cursor-pointer">Ceiling Mount</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Opening Direction
                                                                </Label>
                                                                <Select
                                                                    value={window.openingDirection}
                                                                    onValueChange={(value: OpeningDirection) => updateWindow(window.id, { openingDirection: value })}
                                                                >
                                                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-stone-900 cursor-pointer">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Left" className="cursor-pointer">Left</SelectItem>
                                                                        <SelectItem value="Right" className="cursor-pointer">Right</SelectItem>
                                                                        <SelectItem value="Split" className="cursor-pointer">Split (Both Sides)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Product Type
                                                                </Label>
                                                                <Select
                                                                    value={window.productType}
                                                                    onValueChange={(value: ProductType) => updateWindow(window.id, { productType: value })}
                                                                >
                                                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-stone-900 cursor-pointer">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Sheer Curtains" className="cursor-pointer">Sheer Curtains</SelectItem>
                                                                        <SelectItem value="Blackout Curtains" className="cursor-pointer">Blackout Curtains</SelectItem>
                                                                        <SelectItem value="Dual Curtains" className="cursor-pointer">Dual Curtains</SelectItem>
                                                                        <SelectItem value="Roller Blinds" className="cursor-pointer">Roller Blinds</SelectItem>
                                                                        <SelectItem value="Zebra Blinds" className="cursor-pointer">Zebra Blinds</SelectItem>
                                                                        <SelectItem value="Roman Blinds" className="cursor-pointer">Roman Blinds</SelectItem>
                                                                        <SelectItem value="Wooden Blinds" className="cursor-pointer">Wooden Blinds</SelectItem>
                                                                        <SelectItem value="Aluminium Blinds" className="cursor-pointer">Aluminium Blinds</SelectItem>
                                                                        <SelectItem value="Vertical Blinds" className="cursor-pointer">Vertical Blinds</SelectItem>
                                                                        <SelectItem value="Custom Item" className="cursor-pointer">Custom Item</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Motor Type
                                                                </Label>
                                                                <Select
                                                                    value={window.motorType}
                                                                    onValueChange={(value: MotorType) => updateWindow(window.id, { motorType: value })}
                                                                >
                                                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-stone-900 cursor-pointer">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Manual" className="cursor-pointer">Manual</SelectItem>
                                                                        <SelectItem value="Somfy" className="cursor-pointer">Somfy Motor</SelectItem>
                                                                        <SelectItem value="Other Motor" className="cursor-pointer">Other Motor</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Custom Product Name (if Custom Item) */}
                                                        {window.productType === "Custom Item" && (
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Custom Product Name
                                                                </Label>
                                                                <Input
                                                                    value={window.customProductName || ""}
                                                                    onChange={(e) => updateWindow(window.id, { customProductName: e.target.value })}
                                                                    placeholder="e.g. Skyline Valances, Custom Pelmet, Motorized Track..."
                                                                    className="h-9 sm:h-10 bg-white dark:bg-stone-900 text-xs sm:text-sm"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Fabric Selection */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Fabric Selection
                                                                </Label>
                                                                <span className="text-[10px] text-stone-400">
                                                                    Standard catalog or custom specification
                                                                </span>
                                                            </div>
                                                            <Select
                                                                value={window.fabricSelection}
                                                                onValueChange={(value) => updateWindow(window.id, { fabricSelection: value })}
                                                            >
                                                                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-stone-900 cursor-pointer">
                                                                    <SelectValue placeholder="Select fabric..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {FABRICS.map((fabric) => (
                                                                        <SelectItem key={fabric.id} value={fabric.id} className="cursor-pointer">
                                                                            {fabric.name} (${fabric.price}/m)
                                                                        </SelectItem>
                                                                    ))}
                                                                    <SelectItem value="Custom" className="cursor-pointer">+ Add Custom Fabric...</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Custom Fabric Name */}
                                                        {window.fabricSelection === "Custom" && (
                                                            <div className="space-y-1 animate-in fade-in duration-150">
                                                                <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                    Custom Fabric Name / Color Reference
                                                                </Label>
                                                                <Input
                                                                    value={window.customFabricName || ""}
                                                                    onChange={(e) => updateWindow(window.id, { customFabricName: e.target.value })}
                                                                    placeholder="e.g. Belgian Linen - Sand, Customer Supplied..."
                                                                    className="h-9 sm:h-10 bg-white dark:bg-stone-900 text-xs sm:text-sm"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Notes */}
                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                                Notes / Special Instructions
                                                            </Label>
                                                            <Textarea
                                                                value={window.notes || ""}
                                                                onChange={(e) => updateWindow(window.id, { notes: e.target.value })}
                                                                placeholder="Obstacles, power outlet proximity, handle clearances..."
                                                                className="min-h-14 text-xs sm:text-sm bg-white dark:bg-stone-900 resize-y"
                                                            />
                                                        </div>

                                                        {/* Done button inside form for quick collapsing */}
                                                        <div className="flex justify-end pt-1">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => setEditingWindow(null)}
                                                                className="h-8 px-3 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 cursor-pointer"
                                                            >
                                                                <Check className="w-3 h-3 mr-1" />
                                                                Done Editing {window.name}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    );
                })}
            </Tabs>

            {/* Navigation Footer */}
            <div className="flex flex-col-reverse gap-2.5 border-t border-stone-200 pt-3.5 dark:border-stone-800 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto cursor-pointer h-10 text-sm" onClick={handleBack}>
                    Back to Rooms
                </Button>
                <Button
                    type="button"
                    size="lg"
                    onClick={handleNext}
                    className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 sm:w-auto font-semibold shadow-sm cursor-pointer h-10 text-sm"
                >
                    Continue to Review
                </Button>
            </div>
        </div>
    );
}
