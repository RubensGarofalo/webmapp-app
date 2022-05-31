import {ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
// ol imports
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import {DEF_MAP_MAX_ZOOM, DEF_MAP_MIN_ZOOM} from '../../../constants/map';
import {MapService} from 'src/app/services/base/map.service';
import {TilesService} from 'src/app/services/tiles.service';
import {BehaviorSubject} from 'rxjs';
import {BackgroundGeolocationResponse} from '@awesome-cordova-plugins/background-geolocation/ngx';
const lat_long = {
  latitude: 37.49484,
  longitude: 14.06052,
};
@Component({
  selector: 'webmapp-nav-map',
  templateUrl: './nav-map.component.html',
  styleUrls: ['./nav-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NavMapComponent implements OnInit {
  @Input() track;
  startView: number[] = [lat_long.longitude, lat_long.latitude, 9];
  map: Map;
  location$: BehaviorSubject<any | null> = new BehaviorSubject<any | null>(null);

  private _view: View;

  constructor(private _mapService: MapService, private _tilesService: TilesService) {}
  private _initMap(): void {
    (this._view = new View({
      center: this._mapService.coordsFromLonLat([this.startView[0], this.startView[1]]),
      zoom: 15,
      projection: 'EPSG:3857',
      constrainOnlyCenter: true,
    })),
      (this.map = new Map({
        view: this._view,
        layers: [
          new TileLayer({
            source: this._initializeBaseSource(),
            visible: true,
            zIndex: 0,
          }),
        ],
        target: 'ol-map',
      }));

    setTimeout(() => {
      this.map.updateSize();
    }, 100);
  }
  ngOnInit(): void {
    this._initMap();
  }
  setLocation(loc) {
    this.location$.next(loc);
  }
  /**
   * Initialize the base source of the map
   *
   * @returns the XYZ source to use
   */
  private _initializeBaseSource() {
    return new XYZ({
      maxZoom: DEF_MAP_MAX_ZOOM,
      minZoom: DEF_MAP_MIN_ZOOM,
      tileLoadFunction: (tile: any, url: string) => {
        const coords = this._tilesService.getCoordsFromUr(url);

        this._tilesService
          .getTile(coords, true)
          .then((tileString: string) => {
            tile.getImage().src = tileString;
          })
          .catch(() => {
            tile.getImage().src = url;
          });
      },
      tileUrlFunction: c => {
        return this._tilesService.getTileFromWeb(c);
      },
      projection: 'EPSG:3857',
      tileSize: [256, 256],
    });
  }
}