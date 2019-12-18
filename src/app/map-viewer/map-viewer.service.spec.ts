import { TestBed } from '@angular/core/testing';

import { MapViewerService } from './map-viewer.service';

describe('MapViewerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MapViewerService = TestBed.get(MapViewerService);
    expect(service).toBeTruthy();
  });
});
