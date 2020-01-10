import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-attributes-table',
  templateUrl: './attributes-table.component.html',
  styleUrls: ['./attributes-table.component.css']
})
export class AttributesTableComponent implements OnInit {

  @Input()
  features: Array<any> = [];
  @Input()
  columnsTable: Array<any> = [];
  featuresSelected: Array<any> = [];

  constructor() { }

  ngOnInit() {
  }

  onRowSelect(event: any): void {

  }

  onRowUnselect(event: any): void {
    
  }
}
