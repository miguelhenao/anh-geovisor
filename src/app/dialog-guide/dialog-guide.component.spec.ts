import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogGuideComponent } from './dialog-guide.component';

describe('DialogGuideComponent', () => {
  let component: DialogGuideComponent;
  let fixture: ComponentFixture<DialogGuideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogGuideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
