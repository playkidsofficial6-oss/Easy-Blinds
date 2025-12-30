export interface Brand {
    id: string;
    name: string;
    initials: string;
    colors: {
        primary: string; // For active states, buttons
        secondary: string; // For backgrounds, light accents
        border: string;
        text: string;
    };
    styles: {
        button: string;
        border: string;
        activeBorder: string;
        icon: string;
        badge: string;
        sidebarActive: string;
        card: string;
    };
}

export const brands: Brand[] = [
    {
        id: "easy-blinds",
        name: "Easy Blinds",
        initials: "EB",
        colors: {
            primary: "neutral-900",
            secondary: "neutral-50",
            border: "neutral-200",
            text: "neutral-900"
        },
        styles: {
            button: "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200",
            border: "border-neutral-200 dark:border-neutral-800",
            activeBorder: "peer-data-[state=checked]:border-neutral-900 dark:peer-data-[state=checked]:border-white peer-data-[state=checked]:bg-neutral-50 dark:peer-data-[state=checked]:bg-neutral-950/20",
            icon: "text-neutral-900 dark:text-white",
            badge: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
            sidebarActive: "border-neutral-900 bg-neutral-50 text-neutral-900 font-medium dark:border-white dark:bg-neutral-800 dark:text-white",
            card: "border-l-4 border-l-neutral-900 hover:bg-neutral-50 dark:border-l-neutral-100 dark:hover:bg-neutral-800"
        }
    },
    {
        id: "my-thread",
        name: "My Thread",
        initials: "MT",
        colors: {
            primary: "purple-600",
            secondary: "purple-50",
            border: "purple-200",
            text: "purple-700"
        },
        styles: {
            button: "bg-purple-600 hover:bg-purple-700 text-white",
            border: "border-purple-100 dark:border-purple-900",
            activeBorder: "peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50 dark:peer-data-[state=checked]:bg-purple-950/20",
            icon: "text-purple-600 dark:text-purple-400",
            badge: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
            sidebarActive: "border-purple-600 bg-purple-50 text-purple-900 font-medium dark:border-purple-400 dark:bg-purple-900/20 dark:text-purple-100",
            card: "border-l-4 border-l-purple-600 hover:bg-purple-50/50 dark:border-l-purple-400 dark:hover:bg-purple-900/10"
        }
    },
    {
        id: "oceana",
        name: "Oceana",
        initials: "OC",
        colors: {
            primary: "blue-600",
            secondary: "blue-50",
            border: "blue-200",
            text: "blue-700"
        },
        styles: {
            button: "bg-blue-600 hover:bg-blue-700 text-white",
            border: "border-blue-100 dark:border-blue-900",
            activeBorder: "peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950/20",
            icon: "text-blue-600 dark:text-blue-400",
            badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            sidebarActive: "border-blue-600 bg-blue-50 text-blue-900 font-medium dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-100",
            card: "border-l-4 border-l-blue-600 hover:bg-blue-50/50 dark:border-l-blue-400 dark:hover:bg-blue-900/10"
        }
    },
    {
        id: "hillarys",
        name: "Hillarys",
        initials: "HL",
        colors: {
            primary: "rose-600",
            secondary: "rose-50",
            border: "rose-200",
            text: "rose-700"
        },
        styles: {
            button: "bg-rose-600 hover:bg-rose-700 text-white",
            border: "border-rose-100 dark:border-rose-900",
            activeBorder: "peer-data-[state=checked]:border-rose-600 peer-data-[state=checked]:bg-rose-50 dark:peer-data-[state=checked]:bg-rose-950/20",
            icon: "text-rose-600 dark:text-rose-400",
            badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
            sidebarActive: "border-rose-600 bg-rose-50 text-rose-900 font-medium dark:border-rose-400 dark:bg-rose-900/20 dark:text-rose-100",
            card: "border-l-4 border-l-rose-600 hover:bg-rose-50/50 dark:border-l-rose-400 dark:hover:bg-rose-900/10"
        }
    }
];
