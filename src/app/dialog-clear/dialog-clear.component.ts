import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-dialog-clear',
  templateUrl: './dialog-clear.component.html',
  styleUrls: ['./dialog-clear.component.css']
})
export class DialogClearComponent implements OnInit {
  @Input() _this: any;
  layers: any = [];
  constructor(private fb: FormBuilder) { }

  formClear = this.fb.group({
    layers: new FormControl([]),
    graphics: new FormControl(''),
    selection: new FormControl('')
  });

  ngOnInit(): void {
    this.getLayersToDelete();
  }

  getLayersToDelete() {
    this._this.map.layers.map(layer => {
      (!this._this.isValidOption(layer.title)) ? this.layers.push({ label: layer.title, value: layer.title }) : null;
    });
  }

  clear(all: boolean) {
    if (!all) {
      this.formClear.value.layers.forEach(element => {
        const layer = this._this.map.layers.find(x => x.title === element);
        this._this.map.layers.remove(layer);
      });
    } else {
      this.layers.forEach(element => {
        const layer = this._this.map.layers.find(x => x.title === element.value);
        this._this.map.layers.remove(layer);
      });
    }
    this.formClear.value.graphics || all ? this._this.clearGraphics() : null;
    this.formClear.value.selection || all ? this._this.featuresSelected = [] : null;
    this._this.messageService.add({
      summary: 'Mapa',
      detail: `Los elementos seleccionados han sido removidos exitosamente`,
      severity: 'success'
    });
    this.formClear.reset();
    this._this.modalClear = false;
  }

}
