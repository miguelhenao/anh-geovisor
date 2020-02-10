import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/api';

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
      feature: [this.changeObject.layerSelected, [Validators.required]],
      borderColor: [this.changeObject.borderColor, [Validators.required]],
      fillColor: [this.changeObject.fillColor, [Validators.required]],
      borderSize: [this.changeObject.borderSize, [Validators.required]]
    });
  }

  requestHelp(modal: string): void {
    this.help.requestHelp(modal);
  }
  
  public setupChange(): void {
    this.ref.close(this.changeObject);
  }
}
