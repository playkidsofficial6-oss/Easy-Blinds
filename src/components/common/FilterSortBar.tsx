import React from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterSortBarProps {
    onFilterClick: () => void;
    onSortChange: (sort: string) => void;
    currentSort: string;
    sortOptions?: string[];
    className?: string;
}

export function FilterSortBar({
    onFilterClick,
    onSortChange,
    currentSort,
    sortOptions = ["Default Sorting", "Value: High to Low", "Value: Low to High", "Date: Newest", "Date: Oldest"],
    className,
}: FilterSortBarProps) {
    return (
        <div className={cn("flex items-center w-full border-y border-slate-200 bg-white", className)}>
            {/* Filter Section - 50% width */}
            <div className="flex-1 border-r border-slate-200">
                <Button
                    variant="ghost"
                    onClick={onFilterClick}
                    className="w-full justify-start rounded-none h-12 px-6 hover:bg-slate-50 transition-colors group"
                >
                    <SlidersHorizontal className="w-4 h-4 mr-3 text-slate-500 group-hover:text-slate-900" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600 group-hover:text-slate-900">Filter</span>
                </Button>
            </div>

            {/* Sort Section - 50% width */}
            <div className="flex-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between rounded-none h-12 px-6 hover:bg-slate-50 transition-colors group"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 group-hover:text-slate-900 truncate mr-2">
                                {currentSort}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        {sortOptions.map((option) => (
                            <DropdownMenuItem
                                key={option}
                                onClick={() => onSortChange(option)}
                                className={cn(
                                    "text-xs font-medium cursor-pointer",
                                    currentSort === option ? "text-amber-600 bg-amber-50" : "text-slate-600"
                                )}
                            >
                                {option}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
