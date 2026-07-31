"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";

// Reusing the areas list for consistency
const DUBAI_AREAS = [
    "Al Safa",
    "Al Wasl",
    "Barsha Heights (Tecom)",
    "Bluewaters Island",
    "City Walk",
    "Discovery Gardens",
    "District One",
    "Dubai Design District (d3)",
    "Dubai Healthcare City",
    "Dubai Hills Estate",
    "Dubai Internet City",
    "Dubai Land (Dubailand)",
    "Dubai Marina",
    "Dubai Media City",
    "Dubai Silicon Oasis",
    "Dubai South",
    "Emirates Hills",
    "Jumeirah Islands",
    "Jumeirah Park",
    "MBR City (Mohammed Bin Rashid City)",
    "Meydan",
    "Motor City",
    "Nad Al Sheba",
    "Sports City",
    "The Greens",
    "Town Square",
    "Umm Suqeim 1",
    "Umm Suqeim 2",
    "Umm Suqeim 3",
    "World Trade Centre Area",
    "Other"
];

// Mock data for gallery items
const GALLERY_ITEMS = [
    {
        id: 1,
        title: "Modern Villa Living Room",
        area: "Dubai Hills Estate",
        image: "/placeholder-user.jpg", // Using placeholder for now
        category: "Curtains",
        date: "2024-03-15"
    },
    {
        id: 2,
        title: "Luxury Penthouse Bedroom",
        area: "Dubai Marina",
        image: "/placeholder-user.jpg",
        category: "Blinds",
        date: "2024-03-10"
    },
    {
        id: 3,
        title: "Office Space Blinds",
        area: "Business Bay",
        image: "/placeholder-user.jpg",
        category: "Blinds",
        date: "2024-03-05"
    },
    {
        id: 4,
        title: "Minimalist Apartment",
        area: "Downtown Dubai",
        image: "/placeholder-user.jpg",
        category: "Curtains",
        date: "2024-02-28"
    },
    {
        id: 5,
        title: "Palm Villa Master Bedroom",
        area: "Palm Jumeirah",
        image: "/placeholder-user.jpg",
        category: "Motorized",
        date: "2024-02-20"
    }
];

export default function GalleryPage() {
    const [selectedArea, setSelectedArea] = useState<string>("All");

    // Filter items based on selected area
    const filteredItems = selectedArea === "All"
        ? GALLERY_ITEMS
        : GALLERY_ITEMS.filter(item => item.area === selectedArea);



    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Our Gallery</h1>
                <p className="text-stone-500 dark:text-stone-400">Browse our recent works across Dubai</p>
            </div>

            <Tabs defaultValue="All" className="w-full" onValueChange={setSelectedArea}>
                <div className="overflow-x-auto pb-4">
                    <TabsList className="w-max h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                        <TabsTrigger
                            value="All"
                            className="data-[state=active]:bg-stone-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-stone-900 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 dark:text-stone-400 px-4 py-2 rounded-full"
                        >
                            All Areas
                        </TabsTrigger>
                        {DUBAI_AREAS.map((area) => (
                            <TabsTrigger
                                key={area}
                                value={area}
                                className="data-[state=active]:bg-stone-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-stone-900 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 dark:text-stone-400 px-4 py-2 rounded-full"
                            >
                                {area}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value={selectedArea} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="aspect-video bg-stone-200 relative overflow-hidden">
                                        {/* In a real app, use Next.js Image component */}
                                        <div className="absolute inset-0 bg-stone-300 flex items-center justify-center text-stone-500">
                                            Image Placeholder
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <CardContent className="p-4 bg-white dark:bg-stone-900">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg text-stone-900 dark:text-white">{item.title}</h3>
                                                <div className="flex items-center text-stone-500 dark:text-stone-400 text-sm mt-1">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {item.area}
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{item.category}</Badge>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-4 text-right">
                                            Completed: {item.date}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-stone-500">
                                No projects found in this area yet.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
