"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MeasuringTapeInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number; // Visual step for ticks, not necessarily value step
    className?: string;
    unit?: string;
}

export function MeasuringTapeInput({
    value,
    onChange,
    min = 0,
    max = 500,
    step = 1,
    className,
    unit = "cm",
}: MeasuringTapeInputProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Configuration
    const PIXELS_PER_UNIT = 10; // 1cm = 10px
    const MAJOR_TICK_INTERVAL = 10; // Every 10cm
    const MIDDLE_TICK_INTERVAL = 5; // Every 5cm

    // Calculate total width based on range
    const totalUnits = max - min;
    const totalWidth = totalUnits * PIXELS_PER_UNIT;



    // Convert scroll position to value
    const scrollToValue = (scroll: number) => {
        const rawValue = min + (scroll / PIXELS_PER_UNIT);
        return Math.max(min, Math.min(max, Math.round(rawValue)));
    };

    // Convert value to scroll position
    const valueToScroll = (val: number) => {
        return (val - min) * PIXELS_PER_UNIT;
    };

    // Update scroll position when value changes externally
    useEffect(() => {
        if (!containerRef.current || isDragging) return;

        // Check if we need to scroll (allow 1px error margin)
        const currentScroll = containerRef.current.scrollLeft;
        const targetScroll = valueToScroll(value);

        if (Math.abs(currentScroll - targetScroll) > 1) {
            // Temporarily disable smooth scrolling for instant sync
            containerRef.current.style.scrollBehavior = 'auto';
            containerRef.current.scrollLeft = targetScroll;
            // Re-enable smooth scrolling after a small delay
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.style.scrollBehavior = 'smooth';
                }
            }, 50);
        }
    }, [value, min, isDragging]);

    // Handle scroll event
    const handleScroll = () => {
        if (!containerRef.current) return;
        const currentScroll = containerRef.current.scrollLeft;
        const newValue = scrollToValue(currentScroll);

        // Only update if value actually changed to avoid loop
        if (newValue !== value) {
            // Haptic feedback for supported devices (Android, etc.)
            // Note: iOS Safari does not support navigator.vibrate for web apps
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(5); // 5ms vibration for a subtle "tick"
            }
            onChange(newValue);
        }
    };

    // Mouse drag handling for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll-fast
        containerRef.current.scrollLeft = scrollLeft - walk;
    };

    // Touch handling for mobile/iPad
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        // Don't prevent default here to allow vertical page scrolling if needed, 
        // but for a horizontal slider we usually want to capture the gesture.
        // e.preventDefault(); 
        const x = e.touches[0].pageX - containerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        containerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Generate ticks
    const ticks = [];
    for (let i = min; i <= max; i += step) {
        const isMajor = i % MAJOR_TICK_INTERVAL === 0;
        const isMiddle = !isMajor && i % MIDDLE_TICK_INTERVAL === 0;

        ticks.push(
            <div
                key={i}
                className={cn(
                    "absolute bottom-0 flex flex-col items-center transform -translate-x-1/2 pointer-events-none select-none",
                    isMajor ? "h-10" : isMiddle ? "h-6" : "h-3"
                )}
                style={{ left: `${(i - min) * PIXELS_PER_UNIT}px` }}
            >
                <div
                    className={cn(
                        "w-px bg-stone-400",
                        isMajor ? "h-full bg-stone-800 w-0.5" : "h-full"
                    )}
                />
                {isMajor && (
                    <span className="text-xs font-medium text-stone-600 mt-1 absolute top-full whitespace-nowrap">
                        {i}
                    </span>
                )}
            </div>
        );
    }

    // Padding to allow scrolling to start/end values
    // We need half the container width as padding on both sides
    // Since we don't know container width at render time easily without resize observer,
    // we can use a safe estimate or CSS calc if we make assumptions, 
    // but a better way for a "center" tape is to use a spacer.
    // Let's use a large enough padding that covers most screens, or update dynamically.
    // For simplicity and robustness, let's use 50vw (viewport width) as a safe bet for "half screen"
    // or just a fixed large value like 500px if the container is constrained.
    const paddingX = "calc(50% - 1px)";

    return (
        <div className={cn("relative h-24 bg-stone-50 rounded-lg border border-stone-200 overflow-hidden select-none", className)}>
            {/* Center Indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500 z-10 transform -translate-x-1/2 pointer-events-none">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rotate-45" />
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-stone-900 text-white px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg z-50 border-2 border-white">
                    {value} <span className="text-stone-300 text-xs ml-0.5">{unit}</span>
                    <span className="text-stone-500 mx-1">|</span>
                    {unit === 'cm'
                        ? <>{(value / 2.54).toFixed(1)} <span className="text-stone-300 text-xs">in</span></>
                        : <>{(value * 2.54).toFixed(1)} <span className="text-stone-300 text-xs">cm</span></>
                    }
                </div>
            </div>

            {/* Scrollable Area */}
            <div
                ref={containerRef}
                className="absolute inset-0 overflow-x-auto overflow-y-hidden hide-scrollbar cursor-grab active:cursor-grabbing"
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ scrollBehavior: 'smooth' }}
            >
                <div
                    className="relative h-full"
                    style={{
                        width: `${totalWidth}px`,
                        marginLeft: paddingX,
                        marginRight: paddingX,
                    }}
                >
                    {ticks}
                </div>
            </div>

            {/* Gradient Overlays for depth */}
            <div className="absolute inset-y-0 left-0 w-12 bg-linear-to-r from-stone-50 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none" />
        </div>
    );
}
