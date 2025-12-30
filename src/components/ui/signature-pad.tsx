"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void;
    className?: string;
}

export function SignaturePad({ onSave, className }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.strokeStyle = "black";
            }

            // Handle resizing
            const resizeCanvas = () => {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientHeight;
                }
            };

            resizeCanvas();
            window.addEventListener("resize", resizeCanvas);
            return () => window.removeEventListener("resize", resizeCanvas);
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();

        if (!hasSignature) setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (hasSignature && canvasRef.current) {
            onSave(canvasRef.current.toDataURL());
        }
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = canvas.getBoundingClientRect();
        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHasSignature(false);
                onSave("");
            }
        }
    };

    return (
        <div className={`relative border border-neutral-300 rounded-lg overflow-hidden bg-white ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-neutral-400 hover:text-red-500"
                onClick={clear}
            >
                <Eraser className="w-4 h-4" />
            </Button>
        </div>
    );
}
