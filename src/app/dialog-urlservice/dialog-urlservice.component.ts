import { loadModules } from 'esri-loader';
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
  mainContext: any;
  type: string;
  makingWork = false;

  constructor(private formBuilder: FormBuilder, private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.mainContext = config.data.mainContext;
    this.type = config.data.type;
  }

  ngOnInit() {
    this.validateForm();
  }

  requestHelp(modal: string): void {
    this.mainContext.requestHelp(modal);
  }

  public validateForm(): void {
    this.serviceForm = this.formBuilder.group({
      urlService: ['', [Validators.required]]
    });
  }

  public close(): void {
    this.dialogRef.close();
    this.makingWork = false;
  }

  public sendUrl(): void {
    this.makingWork = true;
    let count;
    loadModules(['esri/layers/KMLLayer', 'esri/layers/WMSLayer', 'esri/layers/GeoJSONLayer', 'esri/layers/CSVLayer']).then(
      ([KMLLayer, WMSLayer, GeoJSONLayer, CSVLayer]) => {
        switch (this.type) {
          case 'kml':
            const kml = new KMLLayer({
              url: this.serviceForm.value.urlService
            });
            count = 1;
            this.mainContext.map.layers.map(layer => { layer.type === 'kml' ? count++ : null });
            kml.title = 'KML ' + count.toString() + ' - ' + kml.title;
            this.mainContext.map.add(kml);
            this.close();
            break;
          case 'wms':
            const wms = new WMSLayer({
              url: this.serviceForm.value.urlService
            });
            count = 1;
            this.mainContext.map.layers.map(layer => { layer.type === 'wms' ? count++ : null });
            wms.title = 'WMS ' + count.toString() + ' - ' + wms.title;
            this.mainContext.map.add(wms);
            this.close();
            break;
          case 'json':
            const geo = new GeoJSONLayer({
              url: this.serviceForm.value.urlService
            });
            count = 1;
            this.mainContext.map.layers.map(layer => { layer.type === 'geojson' ? count++ : null });
            geo.title = 'S-JSON ' + count.toString() + ' - ' + geo.title;
            this.mainContext.map.add(geo);
            this.close();
            break;
          case 'csv':
            const csv = new CSVLayer({
              url: this.serviceForm.value.urlService
            });
            count = 1;
            this.mainContext.map.layers.map(layer => { layer.type === 'csv' ? count++ : null });
            csv.title = 'S-CSV ' + count.toString() + ' - ' + csv.title;
            this.mainContext.map.add(csv);
            this.close();
            break;
          default:
            break;
        }
      });
  }
}
