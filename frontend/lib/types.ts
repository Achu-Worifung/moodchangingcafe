export interface ItemFormProps {
    name ?: string;
    img ?: string | null;
    unitPrice ?: number | string;
    description ?: string;
    stock ?: number | string;
    id ?: string;
}

export interface OrderProps {
    userId ?: string;
    total ?: number;
    taxes ?: number;
    id ?: string;
    email ?: string;
    items ?: Array<{ id: string; quantity: number }>;
    status ?: string;
    createdAt ?: Date | string;
    updatedAt ?: Date | string;
}