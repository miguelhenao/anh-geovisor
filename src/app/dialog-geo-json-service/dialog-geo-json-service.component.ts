import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/api';

@Component({
  selector: 'app-dialog-geo-json-service',
  templateUrl: './dialog-geo-json-service.component.html',
  styleUrls: ['./dialog-geo-json-service.component.css']
})
export class DialogGeoJsonServiceComponent implements OnInit {

  serviceForm: FormGroup;
  urlservice: string;

  constructor(private formBuilder: FormBuilder, private dialogRef: DynamicDialogRef) { }

  ngOnInit() {
    this.validateForm();
  }

  public validateForm(): void {
    this.serviceForm = this.formBuilder.group({
      'urlservice': [ this.urlservice, [Validators.required]]
    });
  }

  public cancel(): void {
    this.dialogRef.close();
  }

  public sendUrl(): void {
    this.dialogRef.close(this.urlservice);
  }

}
