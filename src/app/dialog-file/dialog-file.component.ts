import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef } from 'primeng/api';

@Component({
  selector: 'app-dialog-file',
  templateUrl: './dialog-file.component.html',
  styleUrls: ['./dialog-file.component.css']
})
export class DialogFileComponent implements OnInit {

  constructor(private dialogRef: DynamicDialogRef) { }

  ngOnInit() {
  }

}
