import { Component, OnInit } from '@angular/core';
import { ModalController, NavController, PopoverController } from '@ionic/angular';
import { PhotoService } from 'src/app/services/photo.service';
import { PopoverPhotoType } from 'src/app/types/success.enum';
import { ModalphotosComponent } from '../../modalphotos/modalphotos.component';
import { PopoverphotoComponent } from '../../modalphotos/popoverphoto/popoverphoto.component';

@Component({
  selector: 'webmapp-popover-register',
  templateUrl: './popover-register.component.html',
  styleUrls: ['./popover-register.component.scss'],
})
export class PopoverRegisterComponent implements OnInit {

  public registering: boolean;

  constructor(
    private popoverController: PopoverController,
    private navCtrl: NavController,
    private photoService: PhotoService,
    private _modalController: ModalController
  ) { }

  ngOnInit() {
  }

  track() {
    this.navCtrl.navigateForward('register');
    this.dismiss();
  }

  async photo(ev) {

    this.dismiss();

    let photos = null;

    const popover = await this.popoverController.create({
      component: PopoverphotoComponent,
      event: null,//ev,
      translucent: true
    });
    await popover.present();
    const { role } = await popover.onDidDismiss();
    if (role === PopoverPhotoType.PHOTOS) {
      const image = await this.photoService.shotPhoto(false);
      photos = [image];
    } else if (role === PopoverPhotoType.LIBRARY){
      photos = await this.photoService.getPhotos();
    }

    if (photos.length) {
      const modalPhotos = await this._modalController.create({
        component: ModalphotosComponent,
        componentProps: {
          photoCollection: photos
        }
      });
      await modalPhotos.present();
    }

    // Can be set to the src of an image now
    // imageElement.src = imageUrl;
  }

  waypoint() {
    this.navCtrl.navigateForward('waypoint');
    this.dismiss();
  }

  vocal() {
    console.log('---- ~ file: popover-register.component.ts ~ line 30 ~ PopoverRegisterComponent ~ vocal ~ vocal');
    this.dismiss();
  }

  dismiss() {
    this.popoverController.dismiss();
  }


}