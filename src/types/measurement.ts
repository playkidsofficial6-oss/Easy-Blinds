export type PropertyType = 'Apartment' | 'Villa' | 'Office' | 'Other';
export type RoomType = 'Living Room' | 'Bedroom' | 'Master Bedroom' | 'Office' | 'Kitchen' | 'Dining' | 'Other';
export type MountType = 'Ceiling' | 'Wall';
export type OpeningDirection = 'Left' | 'Right' | 'Split';
export type ProductType = 'Sheer Curtains' | 'Blackout Curtains' | 'Dual Curtains' | 'Roller Blinds' | 'Zebra Blinds' | 'Roman Blinds' | 'Wooden Blinds' | 'Aluminium Blinds' | 'Vertical Blinds' | 'Custom Item';
export type MotorType = 'Manual' | 'Somfy' | 'Other Motor';

export interface WindowMeasurement {
    id: string;
    name: string; // e.g., "Window 1"
    width: number;
    height: number;
    mountType: MountType;
    openingDirection: OpeningDirection;
    productType: ProductType;
    customProductName?: string; // for custom items
    fabricSelection?: string;
    customFabricName?: string; // for custom fabrics
    motorType: MotorType;
    notes?: string;
    photos?: string[]; // URLs
}

export interface Room {
    id: string;
    name: string;
    type: RoomType;
    windows: WindowMeasurement[];
}

export interface ClientDetails {
    name: string;
    phone: string;
    email?: string;
    location: string; // Google Maps link or address
    area: string; // e.g. Marina, Downtown
    propertyType: PropertyType;
    visitDate: Date;
    assignedStaff: string;
}

export interface MeasurementJob {
    id: string;
    client: ClientDetails;
    rooms: Room[];
    status: 'Draft' | 'Completed' | 'Quoted';
    createdAt: Date;
    updatedAt: Date;
}
