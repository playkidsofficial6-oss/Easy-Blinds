"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { Room, RoomType } from "@/types/measurement";
import { Plus, Trash2, Sofa, Bed, Crown, Briefcase, ChefHat, UtensilsCrossed, MoreHorizontal } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

interface RoomManagementStepProps {
    rooms: Room[];
    setRooms: (rooms: Room[]) => void;
    onNext: () => void;
    onBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

const ROOM_TYPES: RoomType[] = [
    "Living Room",
    "Bedroom",
    "Master Bedroom",
    "Office",
    "Kitchen",
    "Dining",
    "Other"
];

const ROOM_ICONS: Record<RoomType, any> = {
    "Living Room": Sofa,
    "Bedroom": Bed,
    "Master Bedroom": Crown,
    "Office": Briefcase,
    "Kitchen": ChefHat,
    "Dining": UtensilsCrossed,
    "Other": MoreHorizontal,
};

const getRoomIcon = (type: RoomType) => {
    const Icon = ROOM_ICONS[type];
    return <Icon className="w-4 h-4" />;
};

export function RoomManagementStep({
    rooms,
    setRooms,
    onNext,
    onBack,
}: RoomManagementStepProps) {
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomType, setNewRoomType] = useState<RoomType>("Living Room");

    const addRoom = () => {
        if (!newRoomName.trim()) return;

        const newRoom: Room = {
            id: uuidv4(),
            name: newRoomName,
            type: newRoomType,
            windows: [],
        };

        setRooms([...rooms, newRoom]);
        setNewRoomName("");
        setNewRoomType("Living Room");
    };

    const removeRoom = (id: string) => {
        setRooms(rooms.filter((room) => room.id !== id));
    };

    const handleNext = () => {
        if (rooms.length === 0) {
            alert("Please add at least one room");
            return;
        }
        onNext();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Room Management</h2>
                <p className="text-stone-500 dark:text-stone-400">Add all rooms that require measurements</p>
            </div>

            {/* Add Room Form */}
            <Card className="p-6 bg-stone-50 dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700">
                <div className="space-y-4">
                    <h3 className="font-semibold text-stone-900 dark:text-white">Add New Room</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="roomType" className="text-base">Room Type</Label>
                            <Select value={newRoomType} onValueChange={(value: RoomType) => setNewRoomType(value)}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            <div className="flex items-center gap-2">
                                                {getRoomIcon(type)}
                                                <span>{type}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="roomName" className="text-base">Room Name / Number</Label>
                            <Input
                                id="roomName"
                                placeholder="e.g., Master Bedroom 1"
                                value={newRoomName}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewRoomName(val.charAt(0).toUpperCase() + val.slice(1));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addRoom();
                                    }
                                }}
                                className="h-12 text-base"
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                type="button"
                                onClick={addRoom}
                                className="h-12 w-full bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 dark:text-stone-900"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Room
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Rooms List */}
            {rooms.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="font-semibold text-stone-900 dark:text-white">Added Rooms ({rooms.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rooms.map((room) => (
                            <Card key={room.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getRoomIcon(room.type)}
                                            <h4 className="font-semibold text-stone-900 dark:text-white text-lg">{room.name}</h4>
                                        </div>
                                        <p className="text-sm text-stone-500 dark:text-stone-400">{room.type}</p>
                                        <p className="text-xs text-stone-400 mt-2">
                                            {room.windows.length} window{room.windows.length !== 1 ? 's' : ''} added
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeRoom(room.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-lg">
                    <p className="text-stone-500">No rooms added yet. Add your first room above.</p>
                </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <Button type="button" variant="outline" size="lg" onClick={onBack}>
                    Back
                </Button>
                <Button type="button" size="lg" onClick={handleNext} className="bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 dark:text-stone-900">
                    Continue to Measurements
                </Button>
            </div>
        </div>
    );
}
