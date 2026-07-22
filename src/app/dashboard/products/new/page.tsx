"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Product } from "@/types/product";

export default function NewProductPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [pricePerSqft, setPricePerSqft] = useState(0);
    const [category, setCategory] = useState("");

    const handleSave = () => {
        const newProduct: Product = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            description,
            images,
            pricePerSqft,
            category,
        };
        console.log("New product:", newProduct);
        // TODO: send to backend
        router.push("/field/products");
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/field/products">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-light text-neutral-900">New Product</h1>
                        <p className="text-neutral-500 text-sm">Add a new product to the catalog</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 border-2">
                        Save Draft
                    </Button>
                    <Button onClick={handleSave} className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Create Product
                    </Button>
                </div>
            </div>

            {/* Form */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Curtains">Curtains</SelectItem>
                                    <SelectItem value="Blinds">Blinds</SelectItem>
                                    <SelectItem value="Shutters">Shutters</SelectItem>
                                    <SelectItem value="Shades">Shades</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price per sqft (AED)</label>
                            <Input type="number" value={pricePerSqft} onChange={e => setPricePerSqft(parseFloat(e.target.value) || 0)} placeholder="e.g., 120" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Images (Max 3)</label>
                            <ImageUpload
                                value={images}
                                onChange={(newImages) => setImages(newImages)}
                                onRemove={(urlToRemove) => setImages(images.filter((url) => url !== urlToRemove))}
                                maxImages={3}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
