export interface Product {
    id: string;
    name: string;
    description?: string;
    images: string[];
    pricePerSqft: number; // AED per square foot
    category: string;
}
