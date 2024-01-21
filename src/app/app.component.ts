import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FilamentService } from './service/filament.service';
import { BehaviorSubject, Observable, catchError, map, of, startWith } from 'rxjs';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { Filament } from './interface/filament';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.filterSubject.asObservable();

  constructor(private filamentService: FilamentService) { }

  ngOnInit(): void {

    this.appState$ = this.filamentService.filaments$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: { ...response, data: { filaments: response.data.filaments.reverse() } } }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  filterFilaments(status: Status): void {
    this.appState$ = this.filamentService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
        startWith({ dataState: DataState.LOADING_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveFilament(filamentForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.filamentService.save$(filamentForm.value as Filament)
      .pipe(
        map(response => {
          this.dataSubject.next(
            { ...response, data: { filaments: [response.data.filament, ...this.dataSubject.value.data.filaments] } }
          );
          document.getElementById('closeModal').click();
          this.isLoading.next(false);
          filamentForm.resetForm();
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADING_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  deleteFilament(filament: Filament): void {
    this.appState$ = this.filamentService.delete$(filament.id)
      .pipe(
        map(response => {
          this.dataSubject.next(
            {
              ...response, data:
                { filaments: this.dataSubject.value.data.filaments.filter(f => f.id !== filament.id) }
            }
          );
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADING_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  changeStatus(filament: Filament): void {
    const newStatus = filament.status === Status.FILAMENT_AVAILABLE
      ? Status.FILAMENT_UNAVAILABLE
      : Status.FILAMENT_AVAILABLE;
  
    this.isLoading.next(true);
    this.appState$ = this.filamentService.updateStatus$(filament.id, newStatus)
      .pipe(
        map(response => {
          this.dataSubject.next({
            ...response,
            data: {
              filaments: this.dataSubject.value.data.filaments.map(f => {
                if (f.id === filament.id) {
                  return { ...f, status: newStatus };
                } else {
                  return f;
                }
              })
            }
          });
  
          this.isLoading.next(false);
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value };
        }),
        startWith({ dataState: DataState.LOADING_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  printpdfReport(): void {
    window.print();
  }

  printReport(): void {
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('filaments');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'filament-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

}
