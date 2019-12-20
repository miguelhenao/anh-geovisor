import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTerminosComponent } from './dialog-terminos.component';

describe('DialogTerminosComponent', () => {
  let component: DialogTerminosComponent;
  let fixture: ComponentFixture<DialogTerminosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogTerminosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTerminosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
