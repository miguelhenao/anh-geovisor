import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/api';

@Component({
  selector: 'app-dialog-urlservice',
  templateUrl: './dialog-urlservice.component.html',
  styleUrls: ['./dialog-urlservice.component.css']
})
export class DialogUrlServiceComponent implements OnInit {

  serviceForm: FormGroup;
  urlservice: string;

  constructor(private formBuilder: FormBuilder, private dialogRef: DynamicDialogRef) { }

  ngOnInit() {
    this.validateForm();
  }

  public validateForm(): void {
    this.serviceForm = this.formBuilder.group({
      urlservice: [this.urlservice, [Validators.required]]
    });
  }

  public cancel(): void {
    this.dialogRef.close();
  }

  public sendUrl(): void {
    this.dialogRef.close(this.urlservice);
  }

}
