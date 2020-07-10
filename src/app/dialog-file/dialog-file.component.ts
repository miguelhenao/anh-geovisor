import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { loadModules } from 'esri-loader';
import { ImportCSV } from '../map-viewer/ImportCSV';
import { geojsonToArcGIS } from '@esri/arcgis-to-geojson-utils';

@Component({
  selector: 'app-dialog-file',
  templateUrl: './dialog-file.component.html',
  styleUrls: ['./dialog-file.component.css']
})
export class DialogFileComponent implements OnInit {
  uploadedFiles: any[] = [];
  dataJSON: Array<any> = [];
  mainContext: any;
  importCsv = new ImportCSV();
  type: string;
  extFile: string;
  valueCoordenate: string;
  formatError = false;
  makingWork = false;
  constructor(private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.type = '.' + config.data.type;
    this.mainContext = config.data.mainContext;
    this.extFile = config.data.extFile;
  }

  ngOnInit() {
    this.valueCoordenate = undefined;
  }
  requestHelp(modal: string): void {
    this.mainContext.requestHelp(modal);
  }

  /**
   * Método de carga de archivo y validaciones necesarias
   * @param event -> Evento de carga
   */
  onUpload(event) {
    if (event.target.elements[0].files.length > 0) {
      this.makingWork = true;
      const fileName = event.target.elements[0].files[0].name;
      if (fileName.indexOf('.csv') !== -1) {
        const form = document.getElementById('uploadForm') as any;
        this.importCsv.uploadFileCsv(form.elements[0].files, this.valueCoordenate, this.mainContext.urlGeometryService,
          this.mainContext.map, this.mainContext.view, this.mainContext);
        this.dialogRef.close();
        this.makingWork = false;
      } else if (fileName.indexOf('.json') !== -1) {
        this.processJson(event.target.elements[0].files[0]);
      } else if (fileName.indexOf('.zip') !== -1 || fileName.indexOf('.gpx') !== -1) {
        this.generateFeatureCollection(fileName, document.getElementById('uploadForm'), this.extFile);
      } else {
        this.formatError = true;
      }
    }
  }

  /**
   * Genera colección a partir de la información encontrada en el archivo fuente
   * @param fileName -> Nombre del archivo
   * @param form -> Formulario del input
   * @param fileType -> Tipo de archivo
   */
  async generateFeatureCollection(fileName, form, fileType) {
    const [esriRequest] = await loadModules(['esri/request']);
    let name = fileName.split('.');
    name = name[0].replace('c:\\fakepath\\', '');
    const params = {
      name,
      targetSR: this.mainContext.view.spatialReference,
      maxRecordCount: 1000,
      enforceInputFileSizeLimit: true,
      enforceOutputJsonSizeLimit: true,
      generalize: true,
      maxAllowableOffset: 10,
      reducePrecision: true,
      numberOfDigitsAfterDecimal: 0
    };
    const myContent = {
      filetype: fileType,
      publishParameters: JSON.stringify(params),
      f: 'json'
    };
    esriRequest(this.mainContext.urlGenerateFeatureCollection, {
      query: myContent,
      body: form,
      responseType: 'json',
      timeout: 0
    }).then((response) => {
      if (fileType === 'shapefile') {
        this.addShapefileToMap(response);
      } else if (fileType === 'gpx') {
        this.addGpxToMap(response.data.featureCollection);
      }
      this.dialogRef.close();
      this.makingWork = false;
    }, (err) => {
      this.dialogRef.close();
      this.makingWork = false;
      this.mainContext.makingWork = false;
      console.error(err);
      this.mainContext.messageService.add({
        summary: 'Error de carga',
        detail: 'No se pudo realizar la petición de carga de capa',
        severity: 'error'
      });
    });
  }

  /**
   * Método encargado de construir un layer de acuerdo a un archivo shapefile
   * @param featureCollection -> Lista de features para construir el layer
   */
  async addShapefileToMap(featureCollection) {
    const [FeatureLayer, Graphic, Field, SimpleRenderer] =
      await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/layers/support/Field', 'esri/renderers/SimpleRenderer']);
    let sourceGraphics = [];
    const layersInOrder = this.sortLayers(featureCollection.data.featureCollection.layers);
    const layers = layersInOrder.map((layer) => {
      let quantityType = 1;
      this.mainContext.map.layers.items.forEach((lay) => {
        if (lay.title.startsWith('Shape')) {
          quantityType += 1;
        }
      });
      let layerName: string;
      if (layer.layerDefinition.name === 'Analisis_Cobertura') {
        layerName = `Shape${quantityType} - Analisis_Departamento`;
      } else {
        layerName = `Shape${quantityType} - ${layer.layerDefinition.name}`;
      }
      const graphics = layer.featureSet.features.map((feature) => {
        return Graphic.fromJSON(feature);
      });
      const renderer = SimpleRenderer.fromJSON(layer.layerDefinition.drawingInfo.renderer);
      sourceGraphics = sourceGraphics.concat(graphics);
      const featureLayer = new FeatureLayer({
        id: 'local',
        copyright: layer.layerDefinition.copyrightText,
        title: layerName,
        objectIdField: 'FID',
        source: graphics,
        fields: layer.layerDefinition.fields.map((field) => {
          return Field.fromJSON(field);
        }),
        renderer
      });
      return featureLayer;
    });
    this.mainContext.map.addMany(layers);
    this.mainContext.view.goTo(sourceGraphics);
  }

  /**
   * Método encargado de la construcción de un layer segun un archivo GPX
   * @param featureCollection -> Lista de features para construir el layer
   */
  async addGpxToMap(featureCollection) {
    const [FeatureLayer, PopupTemplate, Graphic, Field, SimpleRenderer] =
      await loadModules([
        'esri/layers/FeatureLayer', 'esri/PopupTemplate', 'esri/Graphic', 'esri/layers/support/Field', 'esri/renderers/SimpleRenderer']);
    let quantityType = 1;
    this.mainContext.map.layers.items.forEach((lay) => {
      if (lay.title.startsWith('GPX')) {
        quantityType += 1;
      }
    });
    const filename = `GPX${quantityType} - ${featureCollection.layers[0].featureSet.features[0].attributes.name}`;
    let sourceGraphics = [];
    const layers = featureCollection.layers.map((layer) => {
      const graphics = layer.featureSet.features.map((feature) => {
        return Graphic.fromJSON(feature);
      });
      sourceGraphics = sourceGraphics.concat(graphics);
      const popup = new PopupTemplate({
        title: 'Atributos GPX',
        content: '${*}'
      });
      const featureLayer = new FeatureLayer({
        title: filename,
        objectIdField: 'FID',
        source: graphics,
        popupTemplate: popup,
        renderer: SimpleRenderer.fromJSON(layer.layerDefinition.drawingInfo.renderer),
        fields: layer.layerDefinition.fields.map((field) => {
          return Field.fromJSON(field);
        })
      });
      return featureLayer;
    });
    this.mainContext.map.addMany(layers);
    this.mainContext.view.goTo(sourceGraphics);
  }

  validateFormat(event) {
    const fileName = event.target.files[0].name;
    this.formatError = fileName.indexOf(this.type) === -1;
  }

  public processJson(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.addGeoJSONToMap(JSON.parse(reader.result.toString()));
    };
    reader.readAsText(file);
  }

  /**
   * Método encargado de la construcción de un layer según un archivo geoJson
   * @param featureCollection -> Colección de features con los cuales se construiran el layer de geoJson
   */
  async addGeoJSONToMap(featureCollection) {
    const [Graphic, FeatureLayer, Field] = await loadModules(['esri/Graphic', 'esri/layers/FeatureLayer', 'esri/layers/support/Field']);
    let sourceGraphics = [];
    const graphics = featureCollection.features.map((feature) => {
      return Graphic.fromJSON(geojsonToArcGIS(feature));
    });
    let quantityType = 1;
    this.mainContext.map.layers.items.forEach((lay) => {
      if (lay.title.startsWith('GeoJSON')) {
        quantityType += 1;
      }
    });
    sourceGraphics = sourceGraphics.concat(graphics);
    const fields = [
      new Field({
        name: 'ObjectID',
        alias: 'ObjectID',
        type: 'oid'
      })
    ];
    const featureLayer = new FeatureLayer({
      title: `GeoJSON ${quantityType}`,
      source: graphics,
      fields
    });
    this.mainContext.map.add(featureLayer);
    this.mainContext.view.goTo(sourceGraphics);
    this.dialogRef.close();
    this.makingWork = false;
  }

  sortLayers(layers: Array<any>) {
    const layersInOrder = [];
    layers.map(layer => {
      ((layer.featureSet.geometryType).includes('Point') || (layer.featureSet.geometryType).includes('Polyline')) ?
        layersInOrder.push(layer) : layersInOrder.unshift(layer);
    });
    return layersInOrder;
  }
}

