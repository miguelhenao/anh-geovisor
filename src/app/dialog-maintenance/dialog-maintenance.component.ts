import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dialog-maintenance',
  templateUrl: './dialog-maintenance.component.html',
  styleUrls: ['./dialog-maintenance.component.css']
})
export class DialogMaintenanceComponent implements OnInit {

  constructor(private ref: DynamicDialogRef) { }

  ngOnInit() {
  }

  onClose() {
    this.ref.close();
  }

}
