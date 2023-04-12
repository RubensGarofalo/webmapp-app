import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {AlertController, ModalController, NavController} from '@ionic/angular';
import {OldMapComponent} from 'src/app/components/map/old-map/map.component';
import {GeolocationService} from 'src/app/services/geolocation.service';
import {GeoutilsService} from 'src/app/services/geoutils.service';
import {ESuccessType} from '../../types/esuccess.enum';
import {ModalSaveComponent} from './modal-save/modal-save.component';
import {ModalSuccessComponent} from '../../components/modal-success/modal-success.component';
import {SaveService} from 'src/app/services/save.service';
import {ITrack} from 'src/app/types/track';
import {DEF_MAP_LOCATION_ZOOM} from 'src/app/constants/map';
import {LangService} from 'src/app/shared/wm-core/localization/lang.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'webmapp-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  providers: [LangService],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage implements OnInit, OnDestroy {
  private _timerInterval: any;

  @ViewChild('map') map: OldMapComponent;

  public actualSpeed: number = 0;
  public averageSpeed: number = 0;
  public isPaused = false;
  public isRegestering = true;
  public length: number = 0;
  public location: number[];
  public opacity: number = 0;
  public record$: Observable<boolean>;
  public time: {hours: number; minutes: number; seconds: number} = {
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  constructor(
    private _geolocationSvc: GeolocationService,
    private _geoutilsSvc: GeoutilsService,
    private _navCtrl: NavController,
    private _translate: LangService,
    private _alertController: AlertController,
    private _modalCtrl: ModalController,
    private _saveSvc: SaveService,
    private _cdr: ChangeDetectorRef,
  ) {
    this.record$ = this._geolocationSvc.onRecord$;
  }

  backToMap() {
    this._navCtrl.navigateForward('map');
    this.reset();
    this._geolocationSvc.stop();
  }

  background(ev) {
    this.backToMap();
  }

  checkRecording() {
    if (this._geolocationSvc.onRecord$.value) {
      this.isPaused = this._geolocationSvc.paused;
      this.opacity = 1;
      this._timerInterval = setInterval(() => {
        this.time = GeoutilsService.formatTime(this._geolocationSvc.recordTime / 1000);
        this._cdr.detectChanges();
      }, 1000);
      setTimeout(() => {
        this.updateMap();
      }, 100);
    }
  }

  ngOnDestroy() {
    console.log('register.page -> ngOnDestroy');
    try {
      clearInterval(this._timerInterval);
    } catch (e) {}
  }

  ngOnInit() {
    if (this._geolocationSvc.location) {
      this.location = [
        this._geolocationSvc.location.longitude,
        this._geolocationSvc.location.latitude,
        DEF_MAP_LOCATION_ZOOM,
      ];
    }
    this._geolocationSvc.onLocationChange.subscribe(() => {
      this.updateMap();
    });

    this.checkRecording();
  }

  async openModalSuccess(track) {
    const modaSuccess = await this._modalCtrl.create({
      component: ModalSuccessComponent,
      componentProps: {
        type: ESuccessType.TRACK,
        track,
      },
    });
    await modaSuccess.present();
    // await modaSuccess.onDidDismiss();
  }

  async pause(event: MouseEvent) {
    await this._geolocationSvc.pauseRecording();
    this.isPaused = true;
  }

  recordMove(ev) {
    this.opacity = ev;
    this._geolocationSvc.onRecord$.next(true);
  }

  /**
   * Calculate the time values for seconds, minutes and hours given a time in seconds
   *
   * @param timeSeconds the time in seconds
   *
   * @returns
   */
  async recordStart(event: boolean) {
    this.isPaused = false;
    await this._geolocationSvc.startRecording();
    this.checkRecording();
  }

  reset() {
    this.isRegestering = true;
    this.opacity = 0;
    this.time = {hours: 0, minutes: 0, seconds: 0};
    this.actualSpeed = 0;
    this.averageSpeed = 0;
    this.length = 0;
    this._geolocationSvc.onRecord$.next(false);

    this.isPaused = false;
    this._geolocationSvc.stopRecording();
  }

  async resume(event: MouseEvent) {
    await this._geolocationSvc.resumeRecording();
    this.isPaused = false;
  }

  async stop(event: MouseEvent) {
    this.stopRecording();
  }

  async stopRecording() {
    await this._geolocationSvc.pauseRecording();
    this.isPaused = true;

    const modal = await this._modalCtrl.create({
      component: ModalSaveComponent,
    });
    await modal.present();
    const res = await modal.onDidDismiss();

    if (!res.data.dismissed && res.data.save) {
      try {
        clearInterval(this._timerInterval);
      } catch (e) {}
      const geojson = await this._geolocationSvc.stopRecording();
      const track: ITrack = Object.assign(
        {
          geojson,
        },
        res.data.trackData,
        {rawData: JSON.stringify(geojson.properties)},
      );
      const saved = await this._saveSvc.saveTrack(track);

      await this.openModalSuccess(saved);
      this.backToMap();
    } else if (!res.data.dismissed) {
      await this._geolocationSvc.stopRecording();
      this.backToMap();
    }
  }

  updateMap() {
    if (this._geolocationSvc.onRecord$.value && this._geolocationSvc.recordedFeature) {
      this.map.drawTrack(this._geolocationSvc.recordedFeature);
      this.length = this._geoutilsSvc.getLength(this._geolocationSvc.recordedFeature);
      // const timeSeconds = this._geoutilsSvc.getTime(
      //   this._geolocationSvc.recordedFeature
      // );
      // this.time = this.formatTime(timeSeconds);
      this.actualSpeed =
        this._geolocationSvc.location.speed ??
        this._geoutilsSvc.getCurrentSpeed(this._geolocationSvc.recordedFeature);
      this.averageSpeed = this._geoutilsSvc.getAverageSpeed(this._geolocationSvc.recordedFeature);
    }
  }
}
