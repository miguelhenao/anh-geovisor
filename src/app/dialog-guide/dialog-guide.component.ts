import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-dialog-guide',
  templateUrl: './dialog-guide.component.html',
  styleUrls: ['./dialog-guide.component.css']
})
export class DialogGuideComponent implements OnInit, OnChanges {
  @Input() flag: boolean;
  @Input() elementId: string;
  constructor() { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.flag) {
      setTimeout(() => {
        document.getElementById(this.elementId).scrollIntoView({block: 'start', behavior: 'smooth'});
      }, 500);
    }
  }

}
