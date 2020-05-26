import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

export class ChangeSymbology {
  public layerSelected: string;
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
  optionsLayers: Array<any>;
  layerSelected: string;
  help: any;
  changeObject: ChangeSymbology = new ChangeSymbology();

  constructor(private formBuilder: FormBuilder, private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.help = config.data.help;
    this.changeObject.layerSelected = config.data.layerSelected;
    this.optionsLayers = config.data.optionsLayers;
  }

  ngOnInit() {
    this.validateForm();
  }

  public validateForm(): void {
    this.changeForm = this.formBuilder.group({
      feature: new FormControl(this.changeObject.layerSelected, Validators.required),
      borderColor: new FormControl({ r: 0, g: 0, b: 0 }, Validators.required),
      fillColor: new FormControl({ r: 255, g: 0, b: 0 }, Validators.required),
      borderSize: new FormControl(1, Validators.required)
    });
  }

  requestHelp(modal: string): void {
    this.help.requestHelp(modal);
  }

  public setupChange(): void {
    console.log(this.changeForm);
    this.ref.close(this.changeForm.value);
  }
}
