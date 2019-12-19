import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogUrlServiceComponent } from './dialog-urlservice.component';

describe('DialogUrlServiceComponent', () => {
  let component: DialogUrlServiceComponent;
  let fixture: ComponentFixture<DialogUrlServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogUrlServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogUrlServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
