import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MapPageRoutingModule } from './map-routing.module';

import { MapPage } from './map.page';
import { MapModule } from 'src/app/components/map/map.module';
import { RecordingBtnComponent } from './recording-btn/recording-btn.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapPageRoutingModule,
    MapModule,
    TranslateModule
  ],
  declarations: [
    RecordingBtnComponent,
    MapPage
  ]
})
export class MapPageModule { }