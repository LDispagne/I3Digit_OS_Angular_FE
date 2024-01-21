import { Status } from "../enum/status.enum";

export interface Filament {

    id: number;
    type: string;
    color: string;
    weight: number;
    producer: string;
    price: number;
    imageUrl: string;
    status: Status;
}