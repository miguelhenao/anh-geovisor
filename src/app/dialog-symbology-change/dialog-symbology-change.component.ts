import { Component, OnInit, AfterViewChecked } from '@angular/core';
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
export class DialogSymbologyChangeComponent implements OnInit, AfterViewChecked {

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

  ngAfterViewChecked(): void {
    const element = document.getElementById('sample');
    // Fill color
    element.style.backgroundColor = 'rgba(' + this.changeForm.value.fillColor.r + ', ' +
      this.changeForm.value.fillColor.g + ', ' + this.changeForm.value.fillColor.b + ', ' + this.changeForm.value.transparency + ')';
    // Border color
    element.style.borderColor = 'rgb(' + this.changeForm.value.borderColor.r + ', ' +
      this.changeForm.value.borderColor.g + ', ' + this.changeForm.value.borderColor.b + ')';
    element.style.borderWidth = this.changeForm.value.borderSize + 'px';
  }

  /**
   * Método para validar la completitud del formulario
   */
  public validateForm(): void {
    this.changeForm = this.formBuilder.group({
      feature: new FormControl(this.changeObject.layerSelected, Validators.required),
      borderColor: new FormControl({ r: 0, g: 0, b: 0 }, Validators.required),
      fillColor: new FormControl({ r: 255, g: 0, b: 0 }, Validators.required),
      borderSize: new FormControl(1, Validators.required),
      transparency: new FormControl(0.5)
    });
  }

  /**
   * Método que abre la guía de usuario en la sección de Cambiar Simbología
   * @param modal -> Nombre de la sección
   */
  requestHelp(modal: string): void {
    this.help.requestHelp(modal);
  }

  /**
   * Método para aplicar el cambio de simbología
   */
  public setupChange(): void {
    console.log(this.changeForm);
    this.changeForm.value.fillColor.a = this.changeForm.value.transparency;
    this.ref.close(this.changeForm.value);
  }
}
