import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-dialog-guide',
  templateUrl: './dialog-guide.component.html',
  styleUrls: ['./dialog-guide.component.css']
})
export class DialogGuideComponent implements OnInit, OnChanges {
  @Input() flag: boolean;
  @Input() elementId: string;
  currentSection: string;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges() {
    this.currentSection = 'h-introduccion';
    if (this.flag && this.elementId !== null) {
      setTimeout(() => {
        document.getElementById(this.elementId).scrollIntoView({ block: 'start', behavior: 'smooth' });
        this.currentSection = this.elementId;
      }, 500);
    }
  }

  onSectionChange(sectionId: string) {
    this.currentSection = sectionId;
  }

}
