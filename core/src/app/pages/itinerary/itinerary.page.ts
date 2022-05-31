import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {
  AlertController,
  Animation,
  AnimationController,
  Gesture,
  GestureController,
  IonTabs,
  MenuController,
  NavController,
  Platform,
} from '@ionic/angular';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {auditTime, switchMap, take, tap} from 'rxjs/operators';
import {CGeojsonLineStringFeature} from 'src/app/classes/features/cgeojson-line-string-feature';
import {OldMapComponent} from 'src/app/components/map/old-map/map.component';
import {CoinService} from 'src/app/services/coin.service';
import {GeohubService} from 'src/app/services/geohub.service';
import {ShareService} from 'src/app/services/share.service';
import {IConfRootState} from 'src/app/store/conf/conf.reducer';
import {confAUTHEnable} from 'src/app/store/conf/conf.selector';
import {IMapRootState} from 'src/app/store/map/map';
import {setCurrentPoiId, setCurrentTrackId} from 'src/app/store/map/map.actions';
import {mapCurrentTrack, mapCurrentTrackProperties} from 'src/app/store/map/map.selector';
import {downloadPanelStatus} from 'src/app/types/downloadpanel.enum';
import {
  IGeojsonFeature,
  IGeojsonFeatureDownloaded,
  IGeojsonPoi,
  IGeojsonProperties,
} from 'src/app/types/model';
import {ISlopeChartHoverElements} from 'src/app/types/slope-chart';
import {ITrackElevationChartHoverElements} from 'src/app/types/track-elevation-charts';

@Component({
  selector: 'webmapp-itinerary',
  templateUrl: './itinerary.page.html',
  styleUrls: ['./itinerary.page.scss'],
})
export class ItineraryPage implements OnDestroy {
  @ViewChild('itineraryTabs') itineraryTabs: IonTabs;

  public itinerary: IGeojsonFeature;
  public isFavourite: boolean = false;
  public useAnimation = false;
  public useCache = false;

  public pois: Array<IGeojsonPoi> = null;

  public modeFullMap = false;
  public showToolBarOver = false;
  public hideToolBarOver = false;
  public scrollThreshold = 50;
  public scrollShowButtonThreshold = 450;
  trackElevationChartHoverElements$: BehaviorSubject<ITrackElevationChartHoverElements | null> =
    new BehaviorSubject<ITrackElevationChartHoverElements | null>(null);
  public opacity = 1;
  public headerHeight = 105;
  public height = 700; //will be updated by real screen height
  public maxInfoHeigtDifference = 80;
  public maxInfoheight = 850; //from CCS????
  public minInfoheight = 350; //from CCS????

  public showDownload = false;

  public slopeChartHoverElements: ISlopeChartHoverElements;

  private _tabChildEventSubscriptions: Array<Subscription> = [];

  public mapDegrees = 0;

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
  @ViewChild('mapcontainer') mapControl: ElementRef;
  @ViewChild('map') mapComponent: OldMapComponent;
  @ViewChild('headerPageItinerary') headerControl: ElementRef;
  @ViewChild('header') header: ElementRef;
  @ViewChild('lessdetails') lessDetails: ElementRef;
  @ViewChild('moredetails') moreDetails: ElementRef;
  private animation?: Animation;
  private gesture?: Gesture;

  private started: boolean = false;
  private initialStep: number = 0;

  private actualDownloadStatus: downloadPanelStatus;

  currentTrackProperties$: Observable<IGeojsonProperties> = this._storeMap
    .select(mapCurrentTrackProperties)
    .pipe(
      tap(p => {
        if (p != null && p.id != null) {
          this._trackID.next(p.id);
        }
      }),
    );

  currentTrack$: Observable<CGeojsonLineStringFeature | IGeojsonFeatureDownloaded> =
    this._storeMap.select(mapCurrentTrack);
  isFavourite$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  authEnable$: Observable<boolean> = this._storeConf.select(confAUTHEnable);
  private _trackID: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  constructor(
    private _navController: NavController,
    private _menuController: MenuController,
    private _platform: Platform,
    private animationCtrl: AnimationController,
    private gestureCtrl: GestureController,
    private _alertController: AlertController,
    private _translate: TranslateService,
    private _storeMap: Store<IMapRootState>,
    private _shareService: ShareService,
    private _geohubService: GeohubService,
    private _coinService: CoinService,
    private _storeConf: Store<IConfRootState>,
  ) {
    this.setAnimations();
    this.currentTrackProperties$
      .pipe(
        switchMap(t => {
          const trackId = t != null ? t.id ?? null : null;
          if (trackId != null) {
            return this._geohubService.isFavouriteTrack(trackId);
          }
          return of(false);
        }),
        take(1),
      )
      .subscribe(initFav => {
        this.isFavourite$.next(initFav);
      });
  }

  public setTrackElevationChartHoverElements(elements?: ITrackElevationChartHoverElements): void {
    if (elements != null) {
      this.trackElevationChartHoverElements$.next(elements);
    }
  }
  async setAnimations() {
    await this._platform.ready();
    this.height = this._platform.height();
    this.maxInfoheight = this.height - this.maxInfoHeigtDifference;
    const animationPanel = this.animationCtrl
      .create()
      .addElement(this.dragHandleContainer.nativeElement)
      .fromTo(
        'transform',
        'translateY(0)',
        `translateY(-${this.maxInfoheight - this.minInfoheight}px)`,
      );

    this.animation = this.animationCtrl.create().duration(500).addAnimation([animationPanel]);

    this.gesture = this.gestureCtrl.create({
      el: this.lessDetails.nativeElement,
      threshold: 0,
      gestureName: 'handler-drag',
      onMove: ev => this.onMove(ev),
      onEnd: ev => this.onEnd(ev),
    });

    this.gesture.enable(true);
  }

  mapRotation(deg) {
    this.mapDegrees = deg;
  }

  orientNorth() {
    this.mapComponent.orientNorth();
  }

  handleClick() {
    const shouldComplete = this.opacity >= 1;
    this.endAnimation(shouldComplete, this.opacity ? 0 : 1);
  }

  menu() {
    this._menuController.enable(true, 'optionMenu');
    this._menuController.open('optionMenu');
  }

  closeMenu() {
    this._menuController.close('optionMenu');
  }

  share() {
    this._shareService.shareTrackByID(this._trackID.value);
  }

  async favourite() {
    this.isFavourite = await this._geohubService.setFavouriteTrack(
      this._trackID.value,
      !this.isFavourite$.value,
    );

    this.isFavourite$.next(!this.isFavourite$.value);
  }

  navigate() {
    console.log('clicco su nav');
    this._navController.navigateForward(['navigation']);
  }

  back() {
    this._navController.back();
  }

  mapHeigth() {
    const mapHeight = this.height - (this.headerHeight + this.maxInfoheight) * (1 - this.opacity);
    const mapPaddingTop = this.headerHeight * (1 - this.opacity);
    const mapPaddingBottom =
      this.maxInfoheight * (1 - this.opacity) + this.minInfoheight * this.opacity;
    let ret = [mapHeight, mapPaddingTop, mapPaddingBottom];
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

    this.endAnimation(shouldComplete, step);
  }

  clickPoi(poi: IGeojsonPoi) {
    this._navController.navigateForward(['poi']);
    setTimeout(() => {
      this._storeMap.dispatch(setCurrentPoiId({currentPoiId: +poi.properties.id}));
    }, 500);
  }

  private endAnimation(shouldComplete: boolean, step: number) {
    console.log(
      '------- ~ ItineraryPage ~ endAnimation ~ this.maxInfoheight - this.minInfoheight',
      this.maxInfoheight,
      this.minInfoheight,
    );
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

    this.initialStep = shouldComplete ? this.maxInfoheight - this.minInfoheight : 0;
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
    if (this.itineraryTabs) {
      this._tabChildEventSubscriptions.push(
        this.itineraryTabs.ionTabsDidChange.subscribe(() => {
          this._subscribeToTabsEvents();
        }),
      );

      // Subscribe to event if available
      if ((<any>this.itineraryTabs?.outlet)?.activated?.instance?.slopeChartHover?.subscribe) {
        this._tabChildEventSubscriptions.push(
          (<any>this.itineraryTabs.outlet).activated.instance.slopeChartHover
            .pipe(auditTime(100))
            .subscribe((elements: ISlopeChartHoverElements) => {
              this.slopeChartHoverElements = elements;
            }),
        );
      }
    } else this.slopeChartHoverElements = undefined;
  }

  private clamp(min: number, n: number, max: number) {
    const val = Math.max(min, Math.min(n, max));
    this.opacity = 1 - val;
    return val;
  }

  private getStep(ev) {
    const delta = this.initialStep - ev.deltaY;
    return this.clamp(0, delta / (this.maxInfoheight - this.minInfoheight), 1);
  }

  public downloadStatus(status: downloadPanelStatus) {
    this.actualDownloadStatus = status;
  }

  public async endDownload(requireConfirm = false) {
    if (requireConfirm && this.actualDownloadStatus == downloadPanelStatus.DOWNLOADING) {
      const translation = await this._translate
        .get([
          'pages.itinerary.modalconfirm.title',
          'pages.itinerary.modalconfirm.text',
          'pages.itinerary.modalconfirm.confirm',
          'pages.itinerary.modalconfirm.cancel',
        ])
        .toPromise();

      const alert = await this._alertController.create({
        cssClass: 'my-custom-class',
        header: translation['pages.itinerary.modalconfirm.title'],
        message: translation['pages.itinerary.modalconfirm.text'],
        buttons: [
          {
            text: translation['pages.itinerary.modalconfirm.cancel'],
            cssClass: 'webmapp-modalconfirm-btn',
            role: 'cancel',
            handler: () => {},
          },
          {
            text: translation['pages.itinerary.modalconfirm.confirm'],
            cssClass: 'webmapp-modalconfirm-btn',
            handler: () => {
              this.showDownload = false;
            },
          },
        ],
      });

      await alert.present();
    } else {
      this.showDownload = false;
    }
  }

  public toogleFullMap() {
    this.modeFullMap = !this.modeFullMap;
  }

  public lastScroll = 0;
  public scroll(ev) {
    const scrolled = ev.detail.currentY;
    if (
      scrolled > this.scrollThreshold &&
      this.lastScroll <= this.scrollThreshold &&
      this.opacity == 1
    ) {
      this.endAnimation(true, 0.5);
    }
    if (scrolled <= 0 && this.lastScroll > 0 && this.opacity == 0) {
      this.endAnimation(false, 0.5);
    }

    this.hideToolBarOver = scrolled > this.scrollShowButtonThreshold / 2;

    this.showToolBarOver = scrolled > this.scrollShowButtonThreshold;

    this.lastScroll = scrolled;
  }

  public async download() {
    const modalres = await this._coinService.openModal();

    if (modalres) {
      this.showDownload = true;
    }
  }
  ngOnDestroy(): void {
    this._storeMap.dispatch(setCurrentTrackId({currentTrackId: null}));
  }
}
