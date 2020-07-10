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
  infoTool = true;
  constructor(private fb: FormBuilder) { }

  formClear = this.fb.group({
    layers: new FormControl([]),
    graphics: new FormControl(''),
    selection: new FormControl('')
  });

  ngOnInit(): void {
    this.getLayersToDelete();
  }

  /**
   * Método para obtener las capas que son posible eliminar
   */
  getLayersToDelete() {
    this._this.map.layers.map(layer => {
      (!this._this.isValidOption(layer.title)) ? this.layers.push({ label: layer.title, value: layer.title }) : null;
    });
  }

  /**
   * Método para hacer limpieza en el mapa
   * @param all -> Bandera que indica si se puede borrar o no, todo
   */
  clear() {
    this.formClear.value.layers.forEach(element => {
      const layer = this._this.map.layers.find(x => x.title === element);
      this._this.map.layers.remove(layer);
    });
    this.formClear.value.graphics ? this._this.clearGraphics() : null;
    if (this.formClear.value.selection) {
      this._this.featuresSelected.forEach(element => {
        this._this.onRowUnselect({ data: element });
      });
      this._this.featuresSelected = [];
    }
    this.close('Los elementos seleccionados han sido removidos exitosamente');
  }

  clearAll() {
    this._this.confirmationService.confirm({
      message: `<p>¿Desea eliminar todos los elementos?</p>`,
      accept: () => {
        this.layers.forEach(element => {
          const layer = this._this.map.layers.find(x => x.title === element.value);
          this._this.map.layers.remove(layer);
        });
        this._this.clearGraphics();
        this._this.featuresSelected.forEach(element => {
          this._this.onRowUnselect({ data: element });
        });
        this._this.featuresSelected = [];
        this.close('Todos los elementos han sido removidos exitosamente');
      }
    });
  }

  close(message) {
    this._this.messageService.add({
      summary: 'Mapa',
      detail: message,
      severity: 'success'
    });
    this.formClear.reset();
    this._this.modalClear = false;
  }

}
