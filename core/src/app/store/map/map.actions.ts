import {createAction, props} from '@ngrx/store';
import {CGeojsonLineStringFeature} from 'src/app/classes/features/cgeojson-line-string-feature';
import {ILAYER} from 'src/app/types/config';

export const setCurrentLayer = createAction(
  '[map] Set current layer',
  props<{currentLayer: ILAYER}>(),
);

export const setCurrentTrackId = createAction(
  '[map] Set current tack id',
  props<{currentTrackId: number | null; track?: any}>(),
);

export const setCurrentPoiId = createAction(
  '[map] Set current poi id',
  props<{currentPoiId: number}>(),
);

export const loadTrackSuccess = createAction(
  '[map] Success load track',
  props<{currentTrack: CGeojsonLineStringFeature | null}>(),
);

export const loadConfFail = createAction('[map] Set current layer Success Fail');
export const loadTrackFail = createAction('[map] Fail load track');
