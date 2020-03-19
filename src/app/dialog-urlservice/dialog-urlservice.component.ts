import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog-urlservice',
  templateUrl: './dialog-urlservice.component.html',
  styleUrls: ['./dialog-urlservice.component.css']
})
export class DialogUrlServiceComponent implements OnInit {

  serviceForm: FormGroup;
  help: any;
  urlservice: string;

  constructor(private formBuilder: FormBuilder, private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.help = config.data.help;
  }

  ngOnInit() {
    this.validateForm();
  }

  requestHelp(modal: string): void {
    this.help.requestHelp(modal);
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
