"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Camera } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (value: string) => void;
    maxImages?: number;
}

export function ImageUpload({ value, onChange, onRemove, maxImages = 3 }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(Array.from(files));
        }
    };

    const handleFiles = (files: File[]) => {
        const remainingSlots = maxImages - value.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (result) {
                    onChange([...value, result]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(Array.from(files));
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                {value.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 group">
                        <div className="absolute top-2 right-2 z-10">
                            <Button
                                type="button"
                                onClick={() => onRemove(url)}
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <Image fill src={url} alt="Product Image" className="object-cover" />
                    </div>
                ))}
                {value.length < maxImages && (
                    <div className="flex gap-2">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors flex-1",
                                isDragging ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                            )}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-neutral-400" />
                                <p className="text-xs text-neutral-500 font-medium">Upload</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div
                            onClick={() => cameraInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 flex flex-col items-center justify-center cursor-pointer transition-colors flex-1"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Camera className="w-8 h-8 mb-2 text-neutral-400" />
                                <p className="text-xs text-neutral-500 font-medium">Camera</p>
                            </div>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                )}
            </div>
            {value.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    <ImageIcon className="w-4 h-4" />
                    <span>Please upload at least one image for the product.</span>
                </div>
            )}
        </div>
    );
}
