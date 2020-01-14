import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/api';

export class ChangeSymbology {
  public borderColor: any;
  public fillColor: any;
  public borderSize: number;
}

@Component({
  selector: 'app-dialog-symbology-change',
  templateUrl: './dialog-symbology-change.component.html',
  styleUrls: ['./dialog-symbology-change.component.css']
})
export class DialogSymbologyChangeComponent implements OnInit {

  changeForm: FormGroup;
  changeObject: ChangeSymbology = new ChangeSymbology();

  constructor(private formBuilder: FormBuilder, private ref: DynamicDialogRef) { }

  ngOnInit() {
    this.validateForm();
  }

  public validateForm(): void {
    this.changeForm = this.formBuilder.group({
      borderColor: [this.changeObject.borderColor, [Validators.required]],
      fillColor: [this.changeObject.fillColor, [Validators.required]],
      borderSize: [this.changeObject.borderSize, [Validators.required]]
    });
  }

  public setupChange(): void {
    this.ref.close(this.changeObject);
  }
}
