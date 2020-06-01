import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogUbicateCoordinateComponent } from './dialog-ubicate-coordinate.component';

describe('DialogUbicateCoordinateComponent', () => {
  let component: DialogUbicateCoordinateComponent;
  let fixture: ComponentFixture<DialogUbicateCoordinateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogUbicateCoordinateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogUbicateCoordinateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
