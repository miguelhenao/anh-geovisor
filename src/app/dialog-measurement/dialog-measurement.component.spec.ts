import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMeasurementComponent } from './dialog-measurement.component';

describe('DialogMeasurementComponent', () => {
  let component: DialogMeasurementComponent;
  let fixture: ComponentFixture<DialogMeasurementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogMeasurementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogMeasurementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
