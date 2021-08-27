import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Animation,
  AnimationController,
  Gesture,
  GestureController,
  IonTabs,
  MenuController,
  NavController,
  Platform,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { auditTime, take } from 'rxjs/operators';
import { GeohubService } from 'src/app/services/geohub.service';
import { StatusService } from 'src/app/services/status.service';
import { ILocation } from 'src/app/types/location';
import { IGeojsonFeature } from 'src/app/types/model';
import { ISlopeChartHoverElements } from 'src/app/types/slope-chart';

@Component({
  selector: 'webmapp-route',
  templateUrl: './route.page.html',
  styleUrls: ['./route.page.scss'],
})
export class RoutePage implements OnInit {
  @ViewChild('routeTabs') routeTabs: IonTabs;

  public route: IGeojsonFeature;

  public track;

  public opacity = 1;
  public headerHeight = 105;
  public height = 700;
  public maxInfoheight = 350; //from CCS????
  public minInfoheight = 90; //from CCS????

  public slopeChartHoverElements: ISlopeChartHoverElements;

  private _tabChildEventSubscriptions: Array<Subscription> = [];

  public slideOpts = {
    initialSlide: 0,
    speed: 400,
    spaceBetween: 5,
    slidesOffsetAfter: 5,
    slidesOffsetBefore: 5,
    slidesPerView: 3.5,
  };

  @ViewChild('dragHandleIcon') dragHandleIcon: ElementRef;
  @ViewChild('dragHandleContainer') dragHandleContainer: ElementRef;
  @ViewChild('mapControl') mapControl: ElementRef;
  @ViewChild('headerPageRoute') headerControl: ElementRef;
  private animation?: Animation;
  private gesture?: Gesture;

  private started: boolean = false;
  private initialStep: number = 0;

  constructor(
    private _actRoute: ActivatedRoute,
    private _geohubService: GeohubService,
    private _navController: NavController,
    private _menuController: MenuController,
    private _statusService: StatusService,
    private _platform: Platform,
    private animationCtrl: AnimationController,
    private gestureCtrl: GestureController
  ) {}

  async ngOnInit() {
    // this._actRoute.queryParams.subscribe(async (params) => {
    //   const id = params.id;
    //   this.route = await this._geohubService.getEcRoute(id);
    //   console.log('------- ~ file: route.page.ts ~ line 44 ~ RoutePage ~ this._actRoute.queryParams.subscribe ~ this.route', this.route);
    //   this._statusService.route = this.route;
    //   this.track = this.route.geometry;
    // });

    this.route = this._statusService.route;

    if (!this.route) {
      const params = await this._actRoute.queryParams.pipe(take(1)).toPromise();
      const id = params.id ? params.id : 22; //TODO only for debug
      this.route = await this._geohubService.getEcRoute(id);
      this._statusService.route = this.route;
      this.track = this.route.geometry;
    }

    this.track = this.route.geometry;

    await this._platform.ready();
    this.height = this._platform.height();

    this.animation = this.animationCtrl
      .create()
      .addElement(this.dragHandleContainer.nativeElement)
      .duration(1000)
      .fromTo(
        'transform',
        'translateY(0)',
        `translateY(-${this.maxInfoheight - this.minInfoheight}px)`
      );

    this.gesture = this.gestureCtrl.create({
      el: this.dragHandleIcon.nativeElement,
      threshold: 0,
      gestureName: 'handler-drag',
      onMove: (ev) => this.onMove(ev),
      onEnd: (ev) => this.onEnd(ev),
    });

    this.gesture.enable(true);
  }

  // toggleDetail() {
  //   const direction = this.opacity >= 1 ? 1 : -1;
  //   // console.log(
  //   //   '------- ~ file: route.page.ts ~ line 38 ~ RoutePage ~ toggleDetail ~ this.opacity',
  //   //   this.opacity
  //   // );
  //   const interv = setInterval(() => {
  //     this.opacity -= 0.01 * direction;
  //     if (this.opacity <= 0 || this.opacity >= 1) {
  //       clearInterval(interv);
  //     }
  //   }, 10);
  // }

  menu() {
    this._menuController.enable(true, 'optionMenu');
    this._menuController.open('optionMenu');
  }

  closeMenu() {
    this._menuController.close('optionMenu');
  }

  share() {
    console.log(
      '------- ~ file: route.page.ts ~ line 34 ~ RoutePage ~ share ~ share'
    );
  }

  favourite() {
    console.log(
      '------- ~ file: route.page.ts ~ line 38 ~ RoutePage ~ favourite ~ favourite'
    );
  }

  navigate() {
    console.log(
      '------- ~ file: route.page.ts ~ line 38 ~ RoutePage ~ navigate ~ navigate'
    );
  }

  back() {
    this._navController.back();
  }

  mapHeigth() {
    let ret =
      this.height -
      (this.headerHeight + this.maxInfoheight) * (1 - this.opacity);
    return ret;
  }

  private onMove(ev) {
    if (!this.started) {
      this.animation.progressStart(false);
      this.started = true;
    }
    const step = this.getStep(ev);
    this.animation.progressStep(step);
  }

  private onEnd(ev) {
    if (!this.started) {
      return;
    }

    this.gesture.enable(false);

    const step = this.getStep(ev);
    const shouldComplete = step > 0.5;

    this.animation.progressEnd(shouldComplete ? 1 : 0, step);
    this.animation.onFinish(() => {
      this.gesture.enable(true);
      this._subscribeToTabsEvents();
      setTimeout(() => {
        this._subscribeToTabsEvents();
      }, 1000);
    });
    // this.animationMapTop.onFinish(() => { this.gesture.enable(true); });
    // this.animationMapHeight.onFinish(() => { this.gesture.enable(true); });

    this.opacity = shouldComplete ? 0 : 1;

    this.initialStep = shouldComplete
      ? this.maxInfoheight - this.minInfoheight
      : 0;
    this.started = false;
  }

  private _subscribeToTabsEvents() {
    // Delete previous subscription
    for (let i in this._tabChildEventSubscriptions) {
      if (this._tabChildEventSubscriptions[i]?.unsubscribe)
        this._tabChildEventSubscriptions[i].unsubscribe();
    }
    this._tabChildEventSubscriptions = [];

    // Subscribe to tab change event
    if (this.routeTabs) {
      this._tabChildEventSubscriptions.push(
        this.routeTabs.ionTabsDidChange.subscribe(() => {
          this._subscribeToTabsEvents();
        })
      );

      // Subscribe to event if available
      if (
        (<any>this.routeTabs?.outlet)?.activated?.instance?.slopeChartHover
          ?.subscribe
      ) {
        this._tabChildEventSubscriptions.push(
          (<any>this.routeTabs.outlet).activated.instance.slopeChartHover
            .pipe(auditTime(100))
            .subscribe((elements: ISlopeChartHoverElements) => {
              this.slopeChartHoverElements = elements;
            })
        );
      }
    } else this.slopeChartHoverElements = undefined;
  }

  private clamp(min, n, max) {
    const val = Math.max(min, Math.min(n, max));

    this.opacity = 1 - val;
    return val;
  }

  private getStep(ev) {
    const delta = this.initialStep - ev.deltaY;
    return this.clamp(0, delta / (this.maxInfoheight - this.minInfoheight), 1);
  }
}
