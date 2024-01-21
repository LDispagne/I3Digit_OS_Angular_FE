import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CustomResponse } from '../interface/custom-response';
import { Filament } from '../interface/filament';
import { Status } from '../enum/status.enum';

@Injectable({ providedIn: 'root' })
export class FilamentService {

  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  filaments$ = <Observable<CustomResponse>>
    this.http.get<CustomResponse>(`${this.apiUrl}/filament/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  save$ = (filament: Filament) => <Observable<CustomResponse>>
    this.http.post<CustomResponse>(`${this.apiUrl}/filament/save`, filament)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

      filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
      new Observable<CustomResponse>(
        suscriber => {
          console.log(response);
          suscriber.next(
            status === Status.ALL ? { ...response, message: `Filaments filtered by ${status} status` } :
              {
                ...response,
                message: response.data.filaments
                  .filter(filament => filament.status === status).length > 0 ? `Filaments filtered by 
            ${status === Status.FILAMENT_AVAILABLE ? 'Available'
                  : 'Unavailable'} status` : `No filaments of ${status} found`,
                data: {
                  filaments: response.data.filaments
                    .filter(filament => filament.status === status)
                }
              }
          );
          suscriber.complete();
        }
      )
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  delete$ = (filamentId: number) => <Observable<CustomResponse>>
    this.http.delete<CustomResponse>(`${this.apiUrl}/filament/delete/${filamentId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  updateStatus$(filamentId: number, newStatus: string): Observable<CustomResponse> {
    const url = `${this.apiUrl}/filament/update-status/${filamentId}?status=${newStatus}`;
    return this.http.put<CustomResponse>(url, {})
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );
  }  

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(`An error occurred - Error code: ${error.status}`);
  }
}
