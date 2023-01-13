import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {
  allElastic,
  allElasticFail,
  allElasticSuccess,
  searchElastic,
  searchElasticFail,
  searchElasticSuccess,
} from './elastic.actions';
import {ElasticService} from './elastic.service';

@Injectable({
  providedIn: 'root',
})
export class ElasticEffects {
  allElastic$ = createEffect(() =>
    this._actions$.pipe(
      ofType(allElastic),
      switchMap(_ =>
        this._elasticSVC.getALL().pipe(
          map(all => allElasticSuccess({all})),
          catchError(e => of(allElasticFail())),
        ),
      ),
    ),
  );
  searchElastic$ = createEffect(() =>
    this._actions$.pipe(
      ofType(searchElastic),
      switchMap(action =>
        this._elasticSVC.getSearch(action.inputTyped, action.layer).pipe(
          map(search => searchElasticSuccess({search})),
          catchError(e => of(searchElasticFail())),
        ),
      ),
    ),
  );

  constructor(private _elasticSVC: ElasticService, private _actions$: Actions) {}
}
