// inspiration: https://ng-bootstrap.github.io/#/components/table/examples#complete
import { Injectable } from '@angular/core';

import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {debounceTime, delay, switchMap, tap} from 'rxjs/operators';

import { Car } from './car.model';
import { APIResponse, APIMeta } from '../api/query/query-response.model';
import { QueryParams } from '../api/query/query.model'
import { ApiService } from '../api/api-service.service';


export interface CarSearchState extends QueryParams {
  part: string;
  make: string;
  model: string;
  vin: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarSearchService {
  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _paginator$ = new Subject<void>();

  private _data$ = new BehaviorSubject<Car[]>([]);
  private _meta$ = new BehaviorSubject<APIMeta>({
    total: 0
  });

  private _pastFirstLoad: boolean = false;


  private _state: CarSearchState = {
    page: 1,
    perpage: 24,
    part: '',
    make: '',
    model: '',
    vin: '',
    order: '',
  };

  constructor(private api: ApiService) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe((result: APIResponse<Car>) => {
      console.log('INIT LOAD');
      this._parse(result);
      this._pastFirstLoad = true;
    });

    this._paginator$.pipe(
      tap(() => this._loading$.next(true)),
      switchMap(() => this._search()),
      tap(() => this._loading$.next(false))
    ).subscribe((result: APIResponse<Car>) => {
      console.log('NEW LOAD')
      this._append(result);
    });
    
    this._search$.next();
  }

  get data$() { return this._data$.asObservable(); }
  get meta$() { return this._meta$.asObservable(); }
  get loading$() { return this._loading$.asObservable(); }

  get order() { return this._state.order}
  get perPage() { return this._state.perpage; }
  get pastFirstLoad(): boolean { return this._pastFirstLoad; }

  get make() { return this._state.make; }
  get model() { return this._state.model; }
  get vin() { return this._state.vin; }
  get part() { return this._state.part; }

  set perPage(perpage: number) { this._set({perpage}); }
  set order(order: string) { this._set({order}); }

  set make(make: string) { this._set({make}); }
  set model(model: string) { this._set({model}); }
  set vin(vin: string) { this._set({vin});}
  set part(part: string) { this._set({part}); }

  get page() { return this._state.page; }
  set page(page: number) { this._state.page = page }

  loadMore() {
    // TODO: page out of bounds
    this.page++;
    this._paginator$.next();
  }

  hasMore() {
    console.log(`TOTAL: ${this._meta$.value.total} COUNT: ${this._meta$.value.count}`)
    if (this._meta$.value.count) {
      return this._meta$.value.total > this._meta$.value.count;
    } else { 
      return false; 
    } 
  }

  private _set(patch: Partial<CarSearchState>) {
    Object.assign(this._state, patch);
    this.page = 1;
    console.log('NEW STATE: ');
    console.log(this._state);
    this._search$.next();
  }

  private _search(): Observable<APIResponse<Car>> {
    const query = {
      table: 'cars',
      params: this._state
    };

    return this.api.get<Car>(query);
  }

  private _parse(result: APIResponse<Car>) {
    this._data$.next(result.data);
    this._meta$.next(result.meta);
  }

  private _append(result: APIResponse<Car>) {
    let data = this._data$.value.concat(result.data);
    this._data$.next(data);
    this._meta$.next(result.meta);
  }
}
