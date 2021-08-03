import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PhotoItem } from 'src/app/services/photo.service';

@Component({
  selector: 'webmapp-modalphotosave',
  templateUrl: './modalphotosave.component.html',
  styleUrls: ['./modalphotosave.component.scss'],
})
export class ModalphotosaveComponent implements OnInit {

  public photos: PhotoItem[];

  constructor(
    private modalController: ModalController,
  ) { }

  ngOnInit() { }


  close() {
    this.modalController.dismiss({
      dismissed: true
    });
  }

  valChange(value, idx) {
    this.photos[idx].description = value;
  }

  save() {

    this.modalController.dismiss({
      photos: this.photos
    });
  }

  isValid() {
    const res = this.photos.find(x => !x.description);
    return !res;
  }


}