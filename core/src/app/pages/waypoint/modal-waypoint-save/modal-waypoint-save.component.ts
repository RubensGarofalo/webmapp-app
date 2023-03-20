import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ModalController, LoadingController} from '@ionic/angular';
import {ModalSuccessComponent} from 'src/app/components/modal-success/modal-success.component';
import {SaveService} from 'src/app/services/save.service';
import {ILocation} from 'src/app/types/location';
import {ESuccessType} from 'src/app/types/esuccess.enum';
import {WaypointSave} from 'src/app/types/waypoint';
import {IPhotoItem, PhotoService} from 'src/app/services/photo.service';
import {Md5} from 'ts-md5';
import {IConfRootState} from 'src/app/store/conf/conf.reducer';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {confPOIFORMS} from 'src/app/store/conf/conf.selector';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'webmapp-modal-waypoint-save',
  templateUrl: './modal-waypoint-save.component.html',
  styleUrls: ['./modal-waypoint-save.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ModalWaypointSaveComponent implements OnInit {
  confPOIFORMS$: Observable<any[]> = this._storeConf.select(confPOIFORMS);
  public description: string;
  public displayPosition: ILocation;
  public isValidArray: boolean[] = [false, false];
  nominatim: any;
  public photos: any[] = [];
  public position: ILocation;
  public positionCity: string = 'città';
  public positionString: string;
  public title: string;
  public validate = false;
  public waypointtype = 'waypoint';
  fg: FormGroup;

  constructor(
    private _modalCtrl: ModalController,
    private _photoSvc: PhotoService,
    private _saveSvc: SaveService,
    private _loadingCtrl: LoadingController,
    private _storeConf: Store<IConfRootState>,
  ) {}

  async addPhotos() {
    let library = [];
    const loading = await this._loadingCtrl.create();
    loading.present();
    try {
      library = await this._photoSvc.getPhotos();
    } catch (_) {
      loading.dismiss();
    }
    loading.dismiss();
    library.forEach(async libraryItem => {
      const libraryItemCopy = Object.assign({selected: false}, libraryItem);
      const photoData = await this._photoSvc.getPhotoData(libraryItemCopy.photoURL),
        md5 = Md5.hashStr(JSON.stringify(photoData));
      let exists: boolean = false;
      for (let p of this.photos) {
        const pData = await this._photoSvc.getPhotoData(p.photoURL),
          pictureMd5 = Md5.hashStr(JSON.stringify(pData));
        if (md5 === pictureMd5) {
          exists = true;
          break;
        }
      }
      if (!exists) this.photos.push(libraryItemCopy);
    });
  }

  close() {
    this._modalCtrl.dismiss({
      dismissed: true,
    });
  }

  isValid() {
    this.validate = true;
    const allValid = this.isValidArray.reduce((x, curr) => {
      return curr && x;
    }, true);
    return allValid;
  }

  ngOnInit() {
    this.positionString = `${this.position.latitude}, ${this.position.longitude}`;
    setTimeout(() => {
      this.displayPosition = this.position;
    }, 2000);
  }

  async openModalSuccess(waypoint) {
    const modaSuccess = await this._modalCtrl.create({
      component: ModalSuccessComponent,
      componentProps: {
        type: ESuccessType.WAYPOINT,
        waypoint,
      },
    });
    await modaSuccess.present();
    await modaSuccess.onDidDismiss();
  }

  remove(image: IPhotoItem) {
    const i = this.photos.findIndex(
      x => x.photoURL === image.photoURL || (!!x.key && !!image.key && x.key === image.key),
    );
    if (i > -1) {
      this.photos.splice(i, 1);
    }
  }

  async save() {
    if (this.fg.invalid) {
      return;
    }
    const waypoint: WaypointSave = await this._saveSvc.saveWaypoint({
      position: this.position,
      displayPosition: this.displayPosition,
      city: this.positionCity,
      date: new Date(),
      photos: this.photos,
      nominatim: this.nominatim,
      ...this.fg.value,
    });

    this._modalCtrl.dismiss();

    await this.openModalSuccess(waypoint);
  }

  setIsValid(idx: number, isValid: boolean) {
    this.isValidArray[idx] = isValid;
  }
}
