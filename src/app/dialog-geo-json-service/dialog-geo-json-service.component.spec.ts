import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogGeoJsonServiceComponent } from './dialog-geo-json-service.component';

describe('DialogGeoJsonServiceComponent', () => {
  let component: DialogGeoJsonServiceComponent;
  let fixture: ComponentFixture<DialogGeoJsonServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogGeoJsonServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogGeoJsonServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
