import { TestBed } from '@angular/core/testing';

import { DeviceService } from './device.service';

xdescribe('DeviceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DeviceService = TestBed.get(DeviceService);
    expect(service).toBeTruthy();
  });
});
