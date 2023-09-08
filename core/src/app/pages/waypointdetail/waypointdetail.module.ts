import {AppPipeModule} from './../../pipes/pipes.module';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {NgModule} from '@angular/core';
import {WmPipeModule} from 'src/app/shared/wm-core/pipes/pipe.module';
import {WaypointdetailPage} from './waypointdetail.page';
import {WaypointdetailPageRoutingModule} from './waypointdetail-routing.module';
import {SharedModule} from 'src/app/components/shared/shared.module';
import {WmMapModule} from 'src/app/shared/map-core/src/map-core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WaypointdetailPageRoutingModule,
    WmPipeModule,
    WmMapModule,
    AppPipeModule,
    SharedModule,
  ],
  declarations: [WaypointdetailPage],
})
export class WaypointdetailPageModule {}
