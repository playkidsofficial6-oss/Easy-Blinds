"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HoldToConfirmButtonProps {
    onConfirm: () => void;
    label: string;
    subLabel?: string;
    icon: React.ComponentType<any>;
    theme: "amber" | "blue" | "emerald";
    isActive: boolean;
    disabled?: boolean;
}

const themeStyles = {
    amber: {
        activeBg: "bg-amber-600",
        border: "border-amber-500",
        text: "text-amber-500",
        activeText: "text-white"
    },
    blue: {
        activeBg: "bg-blue-600",
        border: "border-blue-500",
        text: "text-blue-500",
        activeText: "text-white"
    },
    emerald: {
        activeBg: "bg-emerald-600",
        border: "border-emerald-500",
        text: "text-emerald-500",
        activeText: "text-white"
    }
};

export function HoldToConfirmButton({
    onConfirm,
    label,
    subLabel,
    icon: Icon,
    theme,
    isActive,
    disabled
}: HoldToConfirmButtonProps) {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const styles = themeStyles[theme];

    useEffect(() => {
        if (isHolding) {
            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(intervalRef.current!);
                        setIsHolding(false);
                        onConfirm();
                        return 100;
                    }
                    return prev + 5; // ~800ms hold time
                });
            }, 25); // Slightly slower for "Heavy" feel
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setProgress(0);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHolding, onConfirm]);

    const startHold = () => {
        if (disabled || isActive) return;
        setIsHolding(true);
    };

    const endHold = () => {
        setIsHolding(false);
    };

    return (
        <div
            className={cn(
                "relative h-24 w-full overflow-hidden select-none touch-none transition-all border-2 rounded-xl",
                isActive
                    ? `border-transparent ${styles.activeBg} shadow-lg shadow-${theme}-900/50`
                    : (disabled ? "bg-neutral-800/30 border-neutral-800 opacity-40 cursor-not-allowed" : `bg-neutral-900 border-neutral-800 cursor-pointer hover:bg-neutral-800 hover:border-neutral-700 active:scale-[0.98]`)
            )}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            style={{ WebkitTapHighlightColor: "transparent" }}
        >
            {/* Progress Bar (Full Background Fill) */}
            {!isActive && !disabled && (
                <div
                    className={cn("absolute inset-y-0 left-0 transition-none z-0 opacity-20", styles.activeBg)}
                    style={{ width: `${progress}%` }}
                ></div>
            )}

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-5">
                    <Icon className={cn("w-8 h-8", isActive ? "text-white" : styles.text)} />
                    <div className="flex flex-col justify-center">
                        <span className={cn(
                            "text-xl font-bold uppercase tracking-wide leading-none mb-1",
                            isActive ? "text-white" : "text-white"
                        )}>
                            {label}
                        </span>
                        {subLabel && (
                            <span className={cn(
                                "text-sm font-medium opacity-80",
                                isActive ? "text-white" : "text-neutral-400"
                            )}>
                                {subLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Indicator / Hold Feedback */}
                {isHolding && !isActive && !disabled && (
                    <span className="text-xs font-bold uppercase text-white animate-pulse tracking-widest">
                        Hold...
                    </span>
                )}

                {isActive && (
                    <div className="bg-white/20 p-2 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
