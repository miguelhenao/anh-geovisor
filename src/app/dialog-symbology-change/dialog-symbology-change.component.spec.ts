import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSymbologyChangeComponent } from './dialog-symbology-change.component';

describe('DialogSymbologyChangeComponent', () => {
  let component: DialogSymbologyChangeComponent;
  let fixture: ComponentFixture<DialogSymbologyChangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogSymbologyChangeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogSymbologyChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
