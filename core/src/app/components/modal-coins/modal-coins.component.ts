import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { StoreService } from 'src/app/services/store.service';

@Component({
  selector: 'app-modal-coins',
  templateUrl: './modal-coins.component.html',
  styleUrls: ['./modal-coins.component.scss'],
})
export class ModalCoinsComponent implements OnInit {

  public message: string;
  public coins: number;

  constructor(
    private _modalController: ModalController,
    private store: StoreService,
    private navController: NavController
  ) { }

  ngOnInit() { }

  async buyone() {
    await this.store.buy(1);
    this._modalController.dismiss({
      dismissed: false,
    });

  }

  buyall() {
    this.navController.navigateForward('store');
    this._modalController.dismiss({
      dismissed: true,
    });
  }

  close() {
    this._modalController.dismiss({
      dismissed: true,
    });
  }



}
