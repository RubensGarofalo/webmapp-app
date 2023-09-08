import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {WmMapModule} from 'src/app/shared/map-core/src/map-core.module';
import {WmPipeModule} from 'src/app/shared/wm-core/pipes/pipe.module';
import {TracklistPageRoutingModule} from './tracklist-routing.module';
import {TracklistPage} from './tracklist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TracklistPageRoutingModule,
    WmPipeModule,
    WmMapModule,
  ],
  declarations: [TracklistPage],
})
export class TracklistPageModule {}
