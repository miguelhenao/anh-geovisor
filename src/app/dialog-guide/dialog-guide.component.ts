import { Component, OnInit, Input, OnChanges, AfterViewChecked } from '@angular/core';

@Component({
  selector: 'app-dialog-guide',
  templateUrl: './dialog-guide.component.html',
  styleUrls: ['./dialog-guide.component.css']
})
export class DialogGuideComponent implements OnInit, AfterViewChecked {

  @Input()
  sectionSelected: string;
  constructor() { }

  ngOnInit() {
  }

  ngAfterViewChecked(): void {
    if (this.sectionSelected) {
      document.getElementById(this.sectionSelected) != null ? document.getElementById(this.sectionSelected).scrollIntoView() : null;
    }
    this.sectionSelected = null;
  }
}
