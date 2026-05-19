"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Room, WindowMeasurement, MountType, OpeningDirection, ProductType, MotorType } from "@/types/measurement";
import { Plus, Trash2, Camera, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { Badge } from "@/components/ui/badge";
import { MeasuringTapeInput } from "@/components/ui/measuring-tape";
import { cn } from "@/lib/utils";

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

export function WindowMeasurementStep({
    rooms,
    setRooms,
    onNext,
    onBack,
}: WindowMeasurementStepProps) {
    const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || "");
    const [editingWindow, setEditingWindow] = useState<string | null>(null);
    const [measurementUnit, setMeasurementUnit] = useState<"cm" | "in">("cm");

    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

    const addWindow = () => {
        if (!selectedRoom) return;

        const newWindow: WindowMeasurement = {
            id: uuidv4(),
            name: `Window ${selectedRoom.windows.length + 1}`,
            width: 150,
            height: 200,
            mountType: "Wall",
            openingDirection: "Split",
            productType: "Sheer Curtains",
            motorType: "Manual",
        };

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: [...room.windows, newWindow] }
                : room
        );
        setRooms(updatedRooms);
        setEditingWindow(newWindow.id);
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
        };

        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: [...room.windows, newWindow] }
                : room
        );
        setRooms(updatedRooms);
        setEditingWindow(newWindow.id);
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

    const deleteWindow = (windowId: string) => {
        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoomId
                ? { ...room, windows: room.windows.filter((w) => w.id !== windowId) }
                : room
        );
        setRooms(updatedRooms);
        setEditingWindow(null);
    };

    const handleNext = () => {
        const totalWindows = rooms.reduce((sum, room) => sum + room.windows.length, 0);
        if (totalWindows === 0) {
            alert("Please add at least one window measurement");
            return;
        }
        onNext();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Window Measurements</h2>
                <p className="text-stone-500 dark:text-stone-400">Add measurements for each window in every room</p>
            </div>

            {/* Room Tabs */}
            <Tabs value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                    {rooms.map((room) => (
                        <TabsTrigger key={room.id} value={room.id} className="px-6 py-3">
                            {room.name}
                            <Badge variant="secondary" className="ml-2">
                                {room.windows.length}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {rooms.map((room) => (
                    <TabsContent key={room.id} value={room.id} className="space-y-4 mt-6">
                        <div className="flex flex-wrap gap-2 justify-between items-center">
                            <h3 className="font-semibold text-lg text-stone-900 dark:text-white">{room.name} - Items</h3>
                            <div className="flex gap-2">
                                <Button onClick={addWindow} variant="outline" className="border-stone-300">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Window
                                </Button>
                                <Button onClick={addCustomItem} className="bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 dark:text-stone-900">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Custom Item
                                </Button>
                            </div>
                        </div>

                        {room.windows.length === 0 ? (
                            <Card className="p-12 text-center border-2 border-dashed">
                                <p className="text-stone-500">No items added yet. Click "Add Window" or "Add Custom Item" to start.</p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {room.windows.map((window) => (
                                    <Card key={window.id} className="overflow-hidden dark:bg-stone-900 dark:border-stone-800">
                                        <CardHeader
                                            className="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                                            onClick={() =>
                                                setEditingWindow(editingWindow === window.id ? null : window.id)
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{window.name}</CardTitle>
                                                    <p className="text-sm text-stone-500 mt-1">
                                                        {window.width}cm × {window.height}cm • {window.productType}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant={editingWindow === window.id ? "default" : "outline"}>
                                                        {editingWindow === window.id ? "Editing" : "Click to edit"}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteWindow(window.id);
                                                        }}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {editingWindow === window.id && (
                                            <CardContent className="pt-6 bg-stone-50 dark:bg-stone-950 border-t dark:border-stone-800">
                                                <div className="flex justify-end mb-4">
                                                    <div className="bg-white dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800 inline-flex">
                                                        <button
                                                            onClick={() => setMeasurementUnit("cm")}
                                                            className={cn(
                                                                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                                                measurementUnit === "cm" ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900" : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                                                            )}
                                                        >
                                                            CM
                                                        </button>
                                                        <button
                                                            onClick={() => setMeasurementUnit("in")}
                                                            className={cn(
                                                                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                                                measurementUnit === "in" ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900" : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                                                            )}
                                                        >
                                                            Inch
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Dimensions */}
                                                    <div className="space-y-2">
                                                        <Label className="text-base">Width ({measurementUnit})</Label>
                                                        <div className="space-y-3">
                                                            <MeasuringTapeInput
                                                                value={measurementUnit === "cm" ? window.width : Number((window.width / 2.54))}
                                                                onChange={(value) => updateWindow(window.id, { width: measurementUnit === "cm" ? value : Number((value * 2.54)) })}
                                                                min={measurementUnit === "cm" ? 50 : 20}
                                                                max={measurementUnit === "cm" ? 500 : 200}
                                                                step={measurementUnit === "cm" ? 1 : 0.5}
                                                                unit={measurementUnit}
                                                                className="mb-2"
                                                            />
                                                            <div className="flex justify-center">
                                                                <div className="relative w-32">
                                                                    <Input
                                                                        type="number"
                                                                        value={measurementUnit === "cm" ? (window.width || "") : (Number((window.width / 2.54)) || "")}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                                            updateWindow(window.id, { width: measurementUnit === "cm" ? val : Number((val * 2.54)) });
                                                                        }}
                                                                        onFocus={(e) => e.target.select()}
                                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                                        className="h-14 text-base text-center pr-8"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">{measurementUnit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(window.width < 80 || window.width > 400) && (
                                                            <div className="flex items-start gap-2 text-orange-600 text-sm">
                                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                <span>Unusual width detected. Please verify.</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Height ({measurementUnit})</Label>
                                                        <div className="space-y-3">
                                                            <MeasuringTapeInput
                                                                value={measurementUnit === "cm" ? window.height : Number((window.height / 2.54))}
                                                                onChange={(value) => updateWindow(window.id, { height: measurementUnit === "cm" ? value : Number((value * 2.54)) })}
                                                                min={measurementUnit === "cm" ? 100 : 40}
                                                                max={measurementUnit === "cm" ? 500 : 200}
                                                                step={measurementUnit === "cm" ? 1 : 0.5}
                                                                unit={measurementUnit}
                                                                className="mb-2"
                                                            />
                                                            <div className="flex justify-center">
                                                                <div className="relative w-32">
                                                                    <Input
                                                                        type="number"
                                                                        value={measurementUnit === "cm" ? (window.height || "") : (Number((window.height / 2.54)) || "")}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                                            updateWindow(window.id, { height: measurementUnit === "cm" ? val : Number((val * 2.54)) });
                                                                        }}
                                                                        onFocus={(e) => e.target.select()}
                                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                                        className="h-14 text-base text-center pr-8"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">{measurementUnit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(window.height < 150 || window.height > 400) && (
                                                            <div className="flex items-start gap-2 text-orange-600 text-sm">
                                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                <span>Unusual height detected. Please verify.</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Mount Type</Label>
                                                        <Select
                                                            value={window.mountType}
                                                            onValueChange={(value: MountType) => updateWindow(window.id, { mountType: value })}
                                                        >
                                                            <SelectTrigger className="h-14 text-base">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Wall">Wall Mount</SelectItem>
                                                                <SelectItem value="Ceiling">Ceiling Mount</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Opening Direction</Label>
                                                        <Select
                                                            value={window.openingDirection}
                                                            onValueChange={(value: OpeningDirection) => updateWindow(window.id, { openingDirection: value })}
                                                        >
                                                            <SelectTrigger className="h-14 text-base">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Left">Left</SelectItem>
                                                                <SelectItem value="Right">Right</SelectItem>

                                                                <SelectItem value="Split">Split (Both Sides)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Product Type</Label>
                                                        <Select
                                                            value={window.productType}
                                                            onValueChange={(value: ProductType) => updateWindow(window.id, { productType: value })}
                                                        >
                                                            <SelectTrigger className="h-14 text-base">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Sheer Curtains">Sheer Curtains</SelectItem>
                                                                <SelectItem value="Blackout Curtains">Blackout Curtains</SelectItem>
                                                                <SelectItem value="Dual Curtains">Dual Curtains</SelectItem>
                                                                <SelectItem value="Roller Blinds">Roller Blinds</SelectItem>
                                                                <SelectItem value="Zebra Blinds">Zebra Blinds</SelectItem>
                                                                <SelectItem value="Roman Blinds">Roman Blinds</SelectItem>
                                                                <SelectItem value="Wooden Blinds">Wooden Blinds</SelectItem>
                                                                <SelectItem value="Aluminium Blinds">Aluminium Blinds</SelectItem>
                                                                <SelectItem value="Vertical Blinds">Vertical Blinds</SelectItem>
                                                                <SelectItem value="Custom Item">Custom Item</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {window.productType === "Custom Item" && (
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-base font-semibold">Custom Product Name</Label>
                                                            <Input
                                                                value={window.customProductName || ""}
                                                                onChange={(e) => updateWindow(window.id, { customProductName: e.target.value })}
                                                                placeholder="e.g. Skyline Valances, Custom Tracks..."
                                                                className="h-14 text-base"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Motor Type</Label>
                                                        <Select
                                                            value={window.motorType}
                                                            onValueChange={(value: MotorType) => updateWindow(window.id, { motorType: value })}
                                                        >
                                                            <SelectTrigger className="h-14 text-base">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Manual">Manual</SelectItem>
                                                                <SelectItem value="Somfy">Somfy Motor</SelectItem>
                                                                <SelectItem value="Other Motor">Other Motor</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-base">Fabric Selection</Label>
                                                        <Select
                                                            value={window.fabricSelection}
                                                            onValueChange={(value) => updateWindow(window.id, { fabricSelection: value })}
                                                        >
                                                            <SelectTrigger className="h-14 text-base">
                                                                <SelectValue placeholder="Select fabric..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {FABRICS.map((fabric) => (
                                                                    <SelectItem key={fabric.id} value={fabric.id}>
                                                                        {fabric.name}
                                                                    </SelectItem>
                                                                ))}
                                                                <SelectItem value="CUSTOM">+ Add Custom Fabric...</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {window.fabricSelection === "CUSTOM" && (
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-base font-semibold">Custom Fabric Name / Reference</Label>
                                                            <Input
                                                                value={window.customFabricName || ""}
                                                                onChange={(e) => updateWindow(window.id, { customFabricName: e.target.value })}
                                                                placeholder="e.g. Belgian Linen - Sand, Customer Supplied..."
                                                                className="h-14 text-base"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-base">Notes</Label>
                                                        <Textarea
                                                            value={window.notes || ""}
                                                            onChange={(e) => updateWindow(window.id, { notes: e.target.value })}
                                                            placeholder="Any special instructions or notes..."
                                                            className="min-h-20 text-base"
                                                        />
                                                    </div>

                                                    {/* <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-base">Photos</Label>
                                                        <Button variant="outline" className="w-full h-14 text-base" type="button">
                                                            <Camera className="w-4 h-4 mr-2" />
                                                            Take Photo
                                                        </Button>
                                                    </div> */}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            <div className="flex justify-between gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <Button type="button" variant="outline" size="lg" onClick={onBack}>
                    Back
                </Button>
                <Button type="button" size="lg" onClick={handleNext} className="bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 dark:text-stone-900">
                    Continue to Review
                </Button>
            </div>
        </div>
    );
}
