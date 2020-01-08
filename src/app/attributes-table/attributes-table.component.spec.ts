import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributesTableComponent } from './attributes-table.component';

describe('AttributesTableComponent', () => {
  let component: AttributesTableComponent;
  let fixture: ComponentFixture<AttributesTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttributesTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
