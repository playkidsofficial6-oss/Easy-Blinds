import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";

// Dummy data - replace with real data fetching later
const dummyProducts: Product[] = [
    {
        id: "p1",
        name: "Premium Roller Blind",
        description: "High quality roller blind",
        images: ["/placeholder-product.jpg"],
        pricePerSqft: 120,
        category: "Roller",
    },
    {
        id: "p2",
        name: "Elegant Venetian Blind",
        description: "Elegant design",
        images: ["/placeholder-product.jpg"],
        pricePerSqft: 150,
        category: "Venetian",
    },
];

export default function ProductsPage() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-neutral-900">Products</h1>
                    <p className="text-neutral-500 text-sm">Manage product catalog</p>
                </div>
                <Link href="/field/products/new">
                    <Button className="h-12 px-8 bg-neutral-900 hover:bg-neutral-800 text-white border-0 font-medium uppercase tracking-wide">
                        <Plus className="w-5 h-5 mr-2" />
                        New Product
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input placeholder="Search products..." className="pl-12 h-12 text-base border-2 border-neutral-200 focus:border-neutral-900" />
                </div>
                <Select>
                    <SelectTrigger className="h-12 w-48 border-2 border-neutral-200">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Roller">Roller</SelectItem>
                        <SelectItem value="Venetian">Venetian</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dummyProducts.map((product) => (
                    <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="p-4">
                            <Image src={product.images[0] || "/placeholder-product.jpg"} alt={product.name} width={400} height={250} className="object-cover rounded" />
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            <CardTitle className="text-lg font-medium">{product.name}</CardTitle>
                            <p className="text-sm text-neutral-600">AED {product.pricePerSqft.toLocaleString()}/sqft</p>
                            <p className="text-xs text-neutral-500">Category: {product.category}</p>
                            <Link href={`/field/products/${product.id}`}>
                                <Button variant="outline" size="sm" className="mt-2">
                                    View Details
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
