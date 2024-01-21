import { Filament } from "./filament";

export interface CustomResponse {

    timeStamp: Date;
    statusCode: number;
    status: string;
    reason: string;
    message: string;
    developerMessage: string;
    data: { filaments?: Filament[], filament?: Filament};

}