import { Injectable } from '@angular/core';
import { interval, ReplaySubject } from 'rxjs';
import { DownloadStatus } from '../types/download';
import { IGeojsonFeature, IGeojsonFeatureDownloaded } from '../types/model';
import { GeohubService } from './geohub.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  public onChangeStatus: ReplaySubject<DownloadStatus> = new ReplaySubject<DownloadStatus>(1);

  private _status: DownloadStatus = {
    finish: false,
    setup: 0,
    map: 0,
    data: 0,
    media: 0,
    install: 0
  }

  private _timer;

  constructor(
    private _geohubservice: GeohubService
  ) { }

  isDownloadedTrack(trackId: number) {
    return false;
  }

  startDownload(trackId: number) {
    const timer = interval(500);
    this._timer = timer.subscribe(val => this.updateStatus());
  }

  removeDownload(trackId: number) {
    //TODO delete downloaded elements
  }

  updateStatus() {
    this._status.setup = Math.min(100, this._status.setup + Math.random() * 30)
    this._status.map = Math.min(100, this._status.map + Math.random() * 30)
    this._status.data = Math.min(100, this._status.data + Math.random() * 30)
    this._status.media = Math.min(100, this._status.media + Math.random() * 30)
    this._status.install = Math.min(100, this._status.install + Math.random() * 30)

    if (
      this._status.setup === 100 &&
      this._status.map === 100 &&
      this._status.data === 100 &&
      this._status.media === 100 &&
      this._status.install === 100
    ) {
      this._status.finish = true;
      this._timer.unsubscribe()
    }

    this.onChangeStatus.next(this._status);


  }

  async getDownloadedTracks(): Promise<Array<IGeojsonFeatureDownloaded>> {
    const downloaded = [22, 23];

    let ids: number[] = downloaded.slice(0);

    const res = await this._geohubservice.getTracks(ids);
    const ret = [];
    res.forEach(t => {
      const t2 = Object.assign({ size: 5 }, t);
      ret.push(t2);
    })
    return ret;
  }
}