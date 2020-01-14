import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService, SelectItem, MessageService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from 'esri-loader';
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { DialogTerminosComponent } from '../dialog-terminos/dialog-terminos.component';
import { geojsonToArcGIS } from '@esri/arcgis-to-geojson-utils';
import { ImportCSV } from './ImportCSV';
import { DialogSymbologyChangeComponent } from '../dialog-symbology-change/dialog-symbology-change.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css'],
  providers: [DialogService, MessageService]
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  view: any;
  eventLayer: any;
  displayTable = false;
  layerSelected: any;
  columnsTable: Array<any> = [];
  latitude = 4.6486259;
  longitude = -74.2478963;
  displayMedicion = false;
  dptosSelected: Array<any> = [];
  makingWork = false;
  featureDptos: Array<any> = [];
  menu: Array<MenuItem> = [];
  loadLayers = 0;
  departmentLayer: any;
  graphics: Array<any> = [];
  map: any;
  search: any;
  sourceSearch: Array<any> = [];
  attributeTable: any;
  leftDialog = 200;
  about = false;
  guide = false;
  activeWidget: any;
  tsLayer: any;
  legend: any;
  agsHost = 'anh-gisserver.anh.gov.co';
  agsProtocol = 'https';
  mapRestUrl = this.agsProtocol + '://' + this.agsHost + '/arcgis/rest/services/Tierras/Mapa_ANH/MapServer';
  agsDir = 'arcgis';
  agsUrlBase = this.agsProtocol + '://' + this.agsHost + '/' + this.agsDir + '/';
  // Url servidor ArcGIS.com para servicios de conversión (sharing)
  sharingUrl = 'https://www.arcgis.com'; // importante que sea https para evitar problemas de SSL
  // Url del servicio de impresión
  printUrl = this.agsUrlBase + 'rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task';
  nameLayer: string;
  displayExtract = false;
  displayAnalisis = false;
  displayBuffer = false;
  optionsPolygon = [
    { name: 'Polígono', value: 'pol' },
    { name: 'Polígono Libre', value: 'free-pol' }
  ];
  optionsBuffer = [
    { name: 'Kilómetros', value: 9036 },
    { name: 'Millas', value: 9093 },
    { name: 'Millas náuticas', value: 9030 },
    { name: 'Millas nauticas (US)', value: 109012 },
    { name: 'Metros', value: 9001 },
    { name: 'Pies', value: 9002 },
  ];

  layerList: any;
  optionsLayers: SelectItem[] = [];
  optionsDepartment: SelectItem[] = [];
  sketch;
  sketchBuffer;
  selectedPolygon: SelectItem;
  selectedBufferSketch: any;
  selectedBuffer: SelectItem = {
    value: 9036
  };
  selectedLayers: SelectItem[] = [];
  clearGraphic = false;
  visibleMenu = true;
  importCsv = new ImportCSV();
  bufDistance: string;
  magnaSirgas = {
    x: null,
    y: null
  };
  magnaSirgasFlag = false;

  modes: SelectItem[] = [
    { value: 'point', title: 'Punto', icon: 'fa fa-fw fa-circle' },
    { value: 'line', title: 'Línea', icon: 'esri-icon-minus' },
    { value: 'polyline', title: 'Polilínea', icon: 'esri-icon-polyline' },
    { value: 'rectangle', title: 'Rectángulo', icon: 'esri-icon-sketch-rectangle' },
    { value: 'polygon', title: 'Polígono', icon: 'esri-icon-polygon' }
  ];

  constructor(private dialogService: DialogService, private service: MapViewerService, private messageService: MessageService) {
    this.setCurrentPosition();
    if (localStorage.getItem('agreeTerms') === undefined) {
      this.dialogService.open(DialogTerminosComponent, {
        width: '100vw',
        height: '100vh',
        showHeader: false
      });
    }
    this.menu = [
      {
        label: 'Mis capas',
        icon: 'pi pi-map-marker',
        items: [
          {
            label: 'Shapefile',
            command: () => {
              const dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo',
                data: { type: 'zip' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  if (res.data.indexOf('.zip') !== -1) {
                    this.makingWork = true;
                    (window as any).ga('send', 'event', 'FORM', 'submit', 'upload-form-shp');
                    this.generateFeatureCollection(res.data, res.form, 'shapefile');
                  }
                }
              });
            }
          },
          {
            label: 'Archivo CSV',
            command: () => {
              const dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo',
                data: { type: 'csv' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  this.makingWork = true;
                  (window as any).ga('send', 'event', 'FORM', 'submit', 'upload-form-csv');
                  this.importCsv.uploadFileCsv(res.form.elements[0].files, res.data, this.agsUrlBase, this.map, this.view, this.makingWork);
                  this.makingWork = false;
                }
              });
            }
          },
          {
            label: 'Archivo GPX',
            command: () => {
              const dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo',
                data: { type: 'gpx' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  if (res.data.indexOf('.gpx') !== -1) {
                    this.makingWork = true;
                    (window as any).ga('send', 'event', 'FORM', 'submit', 'upload-form-gpx');
                    this.generateFeatureCollection(res.data, res.form, 'gpx');
                  }
                }
              });
            }
          },
          {
            label: 'Archivo GeoJSON',
            command: () => {
              const dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo GeoJSON',
                data: { type: 'json' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  this.makingWork = true;
                  (window as any).ga('send', 'event', 'FORM', 'submit', 'upload-form-geojson');
                  this.addGeoJSONToMap(res);
                }
              });
            }
          },
          {
            label: 'Servicio KML',
            command: () => {
              const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio KML',
              });
              dialog.onClose.subscribe(res => {
                loadModules(['esri/layers/KMLLayer']).then(([KMLLayer]) => {
                  this.makingWork = true;
                  (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-kml');
                  const geo = new KMLLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(geo);
                });
              });
            }
          },
          {
            label: 'Servicio WMS',
            command: () => {
              const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio WMS',
              });
              dialog.onClose.subscribe(res => {
                loadModules(['esri/layers/WMSLayer']).then(([WMSLayer]) => {
                  this.makingWork = true;
                  (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-wms');
                  const wms = new WMSLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(wms);
                });
              });
            }
          },
          {
            label: 'Servicio GeoJSON',
            command: () => {
              const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio geoJSON'
              });
              dialog.onClose.subscribe(res => {
                loadModules(['esri/layers/GeoJSONLayer']).then(([GeoJSONLayer]) => {
                  this.makingWork = true;
                  (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-geojson');
                  const geo = new GeoJSONLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(geo);
                });
              });
            }
          },
          {
            label: 'Servicio CSV',
            command: () => {
              const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio CSV'
              });
              dialog.onClose.subscribe(res => {
                loadModules(['esri/layers/CSVLayer']).then(([CSVLayer]) => {
                  this.makingWork = true;
                  (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-csv');
                  const csv = new CSVLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(csv);
                });
              });
            }
          }
        ]
      },
      {
        label: 'Extraer datos',
        icon: 'pi pi-download',
        items: [
          {
            label: 'A Shapefile',
            command: () => {
              this.visibleMenu = false;
              this.optionsLayers = [];
              this.map.layers.items.forEach((layer) => {
                if (layer.title !== null) {
                  this.optionsLayers.push({
                    label: layer.title.substr(11),
                    value: layer.title.substr(11)
                  });
                }
              });
              this.displayExtract = true;
            }
          }
        ]
      },
      {
        label: 'Herramientas',
        icon: 'fa fa-gear',
        items: [
          {
            label: 'Zona de Influencia (Buffer)',
            command: () => {
              this.visibleMenu = false;
              this.displayBuffer = true;
            }
          },
          {
            label: 'Herramientas de Medición',
            command: () => {
              this.displayMedicion = true;
            }
          }
        ]
      },
      {
        label: 'Impresión',
        icon: 'fa fa-print',
        command: () => {
          (window as any).ga('send', 'event', 'BUTTON', 'click', 'print');
          window.print();
        }
      }
    ];
  }

  ngAfterViewChecked() {
    /* let layerList: HTMLCollection = document.getElementsByClassName('esri-layer-list__item--selectable');
    for (let index = 0; index < layerList.length; index++) {
      const element = layerList[index];
      element.addEventListener('click', this.clickItemLayer);
    } */
  }


  /* clickItemLayer: (any) => void = (event: any): void => {
    if (this.layerList.selectedItems.items[0].layer != undefined) {
      let layer = this.layerList.selectedItems.items[0].layer;
      let query = {
        outFields: ['*'],
        returnGeometry: false,
        where: ''
      }
      layer.queryFeatures(query).then((result) => {
        this.featureDptos = result.features;
        this.columnsTable = Object.keys(this.featureDptos[0].attributes);
      }, (err) => {
        console.log(err);
      });
    }
  } */

  /**
   * Consigue la ubicación del computador
   */
  public setCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
    }
  }

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [Map, MapView, FeatureLayer, LayerList, Print, Search, Expand, LabelClass, BasemapGallery, SketchViewModel,
        GraphicsLayer, Graphic, Legend, ScaleBar, ListItem, geometryEngine, SpatialReference, ProjectParameters, GeometryService] =
        await loadModules(['esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer', 'esri/widgets/LayerList', 'esri/widgets/Print',
          'esri/widgets/Search', 'esri/widgets/Expand', 'esri/layers/support/LabelClass', 'esri/widgets/BasemapGallery',
          'esri/widgets/Sketch/SketchViewModel', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/widgets/Legend',
          'esri/widgets/ScaleBar', 'esri/widgets/LayerList/ListItem', 'esri/geometry/geometryEngine', 'esri/geometry/SpatialReference',
          'esri/tasks/support/ProjectParameters', 'esri/tasks/GeometryService']);

      // Geometry Service
      const geomSvc = new GeometryService(this.agsUrlBase + 'rest/services/Utilities/Geometry/GeometryServer');
      // Servidor de AGS desde donde se cargan los servicios, capas, etc.

      // Configure the Map
      const mapProperties = {
        basemap: 'streets'
      };

      const map = new Map(mapProperties);

      this.map = map;
      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [this.longitude, this.latitude],
        zoom: 5,
        map: this.map
      };

      this.addSlider();

      const lyPozo = new FeatureLayer(this.mapRestUrl + '/1', {
        id: 'Pozo',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lyPozo.load().then(() => {
        let text = '';
        for (const field of lyPozo.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templatePozo = {
          title: 'Información Pozo',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyPozo,
          searchFields: ['well_name'],
          displayField: 'well_name',
          exactMatch: false,
          outFields: ['*'],
          name: lyPozo.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyPozo.popupTemplate = templatePozo;
      });

      this.map.add(lyPozo);

      const lyRezumadero = new FeatureLayer(this.mapRestUrl + '/0', {
        id: 'Rezumadero',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lyRezumadero.load().then(() => {
        let text = '';
        for (const field of lyRezumadero.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateRezumadero = {
          title: 'Información Rezumadero',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyRezumadero,
          searchFields: ['Rezumadero'],
          displayField: 'Rezumadero',
          exactMatch: false,
          outFields: ['*'],
          name: lyRezumadero.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyRezumadero.popupTemplate = templateRezumadero;
      });

      this.map.add(lyRezumadero);

      const lySismica = new FeatureLayer(this.mapRestUrl + '/2', {
        id: 'Sismica 2D',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lySismica.load().then(() => {
        let text = '';
        for (const field of lySismica.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSismica = {
          title: 'Información Sismica',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySismica,
          searchFields: ['SURVEY_NAM'],
          displayField: 'SURVEY_NAM',
          exactMatch: false,
          outFields: ['*'],
          name: lySismica.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lySismica.popupTemplate = templateSismica;
      });

      this.map.add(lySismica);

      const lySismica3d = new FeatureLayer(this.mapRestUrl + '/3', {
        id: 'Sismica 3D',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lySismica3d.load().then(() => {
        let text = '';
        for (const field of lySismica3d.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSismica3d = {
          title: 'Información Sismica 3D',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySismica3d,
          searchFields: ['NOMBRE'],
          displayField: 'NOMBRE',
          exactMatch: false,
          outFields: ['*'],
          name: lySismica3d.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lySismica3d.popupTemplate = templateSismica3d;
      });

      this.map.add(lySismica3d);

      const lyMunicipio = new FeatureLayer(this.mapRestUrl + '/5', {
        id: 'Municipio',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lyMunicipio.load().then(() => {
        let text = '';
        for (const field of lyMunicipio.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateMunicipio = {
          title: 'Info',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyMunicipio,
          searchFields: ['NOMBRE_ENT'],
          displayField: 'NOMBRE_ENT',
          exactMatch: false,
          outFields: ['*'],
          name: lyMunicipio.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyMunicipio.popupTemplate = templateMunicipio;
      });

      this.map.add(lyMunicipio);

      const lyDepartamento = new FeatureLayer(this.mapRestUrl + '/4', {
        id: 'Departamento',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lyDepartamento.load().then(() => {

        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyDepartamento,
          searchFields: ['DEPARTAMEN'],
          displayField: 'DEPARTAMEN',
          exactMatch: false,
          outFields: ['*'],
          name: lyDepartamento.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        let text = '';
        for (const field of lyDepartamento.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateDepartamento = {
          title: 'Info',
          content: text,
          fieldInfos: []
        };
        lyDepartamento.popupTemplate = templateDepartamento;
      });

      this.map.add(lyDepartamento);

      this.departmentLayer = lyDepartamento;

      const lyCuencas = new FeatureLayer(this.mapRestUrl + '/6', {
        id: 'Cuencas',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lyCuencas.load().then(() => {
        let text = '';
        for (const field of lyCuencas.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateCuencas = {
          title: 'Info',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyCuencas,
          searchFields: ['NOMBRE', 'FID_CUENCA'],
          displayField: 'NOMBRE',
          exactMatch: false,
          outFields: ['*'],
          name: lyCuencas.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyCuencas.popupTemplate = templateCuencas;
      });

      this.map.add(lyCuencas);

      const lyTierras = new FeatureLayer(this.mapRestUrl + '/8', {
        id: 'Tierras',
        opacity: 0.5,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      lyTierras.load().then(() => {
        const query = {
          outFields: ['*'],
          returnGeometry: false,
          where: ''
        };
        lyTierras.queryFeatures(query).then((result) => {
          this.featureDptos = result.features;
          this.columnsTable = Object.keys(this.featureDptos[0].attributes);
        }, (err) => {
          console.log(err);
        });
        const searchField: Array<any> = [];
        let text = '';
        this.layerSelected = lyTierras;
        for (const field of lyTierras.fields) {
          searchField.push(field.name);
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateTierras = {
          title: 'Info',
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyTierras,
          searchFields: ['CONTRAT_ID'],
          displayField: 'CONTRAT_ID',
          exactMatch: false,
          outFields: ['*'],
          name: lyTierras.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyTierras.popupTemplate = templateTierras;
      });

      const statesLabelClass = new LabelClass({
        labelExpressionInfo: { expression: '$feature.CONTRAT_ID' },
        symbol: {
          type: 'text',  // autocasts as new TextSymbol()
          color: 'black',
          haloSize: 1,
          haloColor: 'white'
        }
      });

      lyTierras.labelingInfo = [statesLabelClass];
      this.map.add(lyTierras);

      const lySensibilidad = new FeatureLayer(this.mapRestUrl + '/7', {
        labelExpressionInfo: { expression: '$feature.CONTRAT_ID' },
        id: 'Sensibilidad',
        opacity: 0.5,
        visible: false,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      lySensibilidad.labelingInfo = [statesLabelClass];
      this.map.add(lySensibilidad);

      this.view = new MapView(mapViewProperties);
      this.view.on('click', (e) => {
        (window as any).ga('send', 'event', 'MAP-CONTROL', 'click', 'overviewMap');
        if (this.activeWidget.viewModel.mode !== undefined) {
          if (this.activeWidget.viewModel.mode === 'capture') {
            const outSR = new SpatialReference({ wkid: 3116 }); // MAGNA-SIRGAS / Colombia Bogota zone
            const params = new ProjectParameters();
            params.geometries = [e.mapPoint];
            params.outSR = outSR;
            geomSvc.project(params).then((response) => {
              this.magnaSirgas.x = response[0].x.toFixed(4);
              this.magnaSirgas.y = response[0].y.toFixed(4);
              this.magnaSirgasFlag = true;
            });
          }
        }
      });

      this.view.on('layerview-create', () => {
        this.loadLayers++;
      });

      const layerList = new LayerList({
        selectionEnabled: true,
        multipleSelectionEnabled: true,
        view: this.view,
        listItemCreatedFunction: (event) => {
          const item = event.item;
          if (event.item.layer === lyDepartamento) {
            item.actionsSections = [
              [{
                title: 'Tabla de Atributos',
                className: 'esri-icon-table',
                id: 'attr-table'
              }, {
                title: 'Analisis de Cobertura',
                className: 'esri-icon-description',
                id: 'analisis'
              }], [{
                title: 'Aumentar opacidad',
                className: 'esri-icon-up',
                id: 'increase-opacity'
              }, {
                title: 'Reducir opacidad',
                className: 'esri-icon-down',
                id: 'decrease-opacity'
              }]
            ];
          } else {
            item.actionsSections = [
              [{
                title: 'Tabla de Atributos',
                className: 'esri-icon-table',
                id: 'attr-table'
              }], [{
                title: 'Aumentar opacidad',
                className: 'esri-icon-up',
                id: 'increase-opacity'
              }, {
                title: 'Reducir opacidad',
                className: 'esri-icon-down',
                id: 'decrease-opacity'
              }]
            ];
          }
        }
      });
      this.view.when(() => {
        layerList.on('trigger-action', (event) => {
          const layer = event.item.layer;
          if (event.action.id === 'attr-table') {
            const query = {
              outFields: ['*'],
              returnGeometry: false,
              where: ''
            };
            layer.queryFeatures(query).then((result) => {
              this.featureDptos = result.features;
              this.columnsTable = Object.keys(this.featureDptos[0].attributes);
              this.layerSelected = layer;
              this.displayTable = true;
            }, (err) => {
              console.log(err);
            });
          } else if (event.action.id === 'analisis') {
            const query = {
              outFields: ['*'],
              returnGeometry: false,
              where: ''
            };
            layer.queryFeatures(query).then((result) => {
              const dptos: Array<any> = [];
              for (const r of result.features) {
                const dpto = {
                  attributes: Object.assign({}, r.attributes)
                };
                dptos.push(dpto);
              }
              this.featureDptos = dptos;
              this.dptosSelected = [];
              this.layerSelected = layer;
              this.displayAnalisis = true;
            }, (err) => {
              console.log(err);
            });
          } else if (event.action.id === 'simbologia') {
            const dialog = this.dialogService.open(DialogSymbologyChangeComponent, {
              width: '25%',
              header: `Cambio de Simbología ${layer.title}`
            });
            dialog.onClose.subscribe(res => {
              if (res !== undefined) {
                (window as any).ga('send', 'event', 'BUTTON', 'click', 'symbol-start');
                this.makingWork = true;
                loadModules(['esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleFillSymbol',
                  'esri/symbols/SimpleLineSymbol', 'esri/Color', 'esri/renderers/SimpleRenderer']).then(([
                    SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Color, SimpleRenderer]) => {
                    let defaultSymbol: any;
                    switch (layer.geometryType) {
                      case 'point':
                        defaultSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 8, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(res.borderColor), 1), new Color(res.fillColor));
                        break;
                      case 'polygon':
                        defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(res.borderColor), res.borderSize), new Color(res.fillColor));
                        break;
                      case 'polyline':
                        defaultSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(res.borderColor), res.borderSize);
                        break;
                    }
                    const renderer = new SimpleRenderer();
                    renderer.symbol = defaultSymbol;
                    layer.renderer = renderer;
                  });
                this.makingWork = false;
              }
            });
          }
        });
      });

      const item = new ListItem({ layer: lyTierras });
      layerList.selectedItems.add(item);
      this.layerList = layerList;
      const layerListExpand = new Expand({
        expandIconClass: 'esri-icon-layers',
        expandTooltip: 'Tabla de contenido',
        view: this.view,
        content: layerList,
        group: 'bottom-right',
      });

      this.search = new Search({
        view: this.view,
        sources: this.sourceSearch,
        includeDefaultSources: false
      });
      this.view.ui.add(this.search, {
        position: 'top-right'
      });

      this.view.ui.move(['zoom'], 'top-right');

      const print = new Print({
        view: this.view,
        printServiceUrl: 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'
      });
      const expandPrint = new Expand({
        expandIconClass: 'esri-icon-download',
        expandTooltip: 'Exportar',
        view: this.view,
        content: print,
        group: 'top-right'
      });

      const legend = new Legend({
        view: this.view,
      });
      this.legend = legend;
      const expandLegend = new Expand({
        expandIconClass: 'esri-icon-layer-list',
        expandTooltip: 'Convenciones',
        view: this.view,
        content: legend,
        group: 'bottom-right'
      });

      const basemapGallery = new BasemapGallery({
        view: this.view
      });
      const expandBaseMapGallery = new Expand({
        expandIconClass: 'esri-icon-basemap',
        expandTooltip: 'Mapa base',
        view: this.view,
        content: basemapGallery,
        group: 'top-right'
      });

      const graphicsLayer = new GraphicsLayer();

      const sketchVM = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });

      sketchVM.on('create', (event) => {
        if (this.view.graphics.length === 1) {
          this.clearGraphics();
        }
        if (event.state === 'complete') {
          this.clearGraphic = true;
          const symbolF = {
            type: 'simple-fill',
            color: [255, 255, 0, 0.25],
            style: 'solid',
            outline: {
              color: [255, 0, 0],
              width: 2,
              style: 'dash-dot'
            }
          };
          const graphic = new Graphic({
            geometry: event.graphic.geometry,
            symbol: symbolF
          });
          this.view.graphics.add(graphic);
        }
      });

      const sketchVMBuffer = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });

      sketchVMBuffer.on('create', (event) => {
        if (event.state === 'complete') {
          this.clearGraphic = true;
          let symbolGeo;
          const geometry = event.graphic.geometry;
          switch (geometry.type) {
            case 'point':
              symbolGeo = { type: 'simple-marker', color: [226, 0, 0] };
              break;
            default:
              symbolGeo = {
                type: 'simple-fill',
                color: [255, 0, 0, 0.25],
                style: 'solid',
                outline: { color: [255, 0, 0], width: 1, style: 'solid' }
              };
              break;
          }
          const symbolBuffer = {
            type: 'simple-fill',
            color: [255, 0, 0, 0.35],
            style: 'solid',
            outline: {
              color: [255, 0, 0, 0.65], width: 2, style: 'solid'
            }
          };
          const graphic = new Graphic({
            geometry,
            symbol: symbolGeo
          });
          this.view.graphics.add(graphic);
          if (this.bufDistance !== undefined) {
            const buffer = geometryEngine.geodesicBuffer(geometry, this.bufDistance, this.selectedBuffer.value);
            this.view.graphics.add(
              new Graphic({
                geometry: buffer,
                symbol: symbolBuffer
              })
            );
          }
        }
      });

      this.sketch = sketchVM;
      this.sketchBuffer = sketchVMBuffer;

      const scaleBar = new ScaleBar({
        style: 'line',
        view: this.view,
        unit: 'dual'
      });

      this.view.ui.add(scaleBar, {
        position: 'bottom-left',
      });

      const attributeTable = new Expand({
        expandIconClass: 'esri-icon-table',
        view: this.view,
        mode: 'drawer',
        iconNumber: this.featureDptos.length,
        content: document.getElementById('attributeTable')
      });

      const help = new Expand({
        expandIconClass: 'esri-icon-question',
        view: this.view,
        content: document.getElementById('help'),
        group: 'bottom-right'
      });
      help.expand();
      this.attributeTable = attributeTable;
      this.view.ui.add([expandLegend, layerListExpand, help], 'bottom-right');
      this.view.ui.add([expandPrint, expandBaseMapGallery], 'top-right');
      return this.view;
    } catch (error) {
      console.log('EsriLoader: ', error);
    }
  }
  clearGraphics() {
    this.view.graphics.removeAll();
    this.clearGraphic = false;
  }

  ngOnInit() {
    this.initializeMap();
  }

  public onHideDialogMedicion(): void {
    this.setActiveButton(null);
    this.setActiveWidget(null);
  }

  public setActiveWidget(type) {
    loadModules(['esri/widgets/DistanceMeasurement2D', 'esri/widgets/AreaMeasurement2D', 'esri/widgets/CoordinateConversion']).then((
      [DistanceMeasurement2D, AreaMeasurement2D, CoordinateConversion]) => {
      this.activeWidget != null ? this.activeWidget.destroy() : null;
      this.activeWidget = null;
      const container = document.createElement('div');
      container.id = 'divWidget';
      document.getElementById('widgetMeasure').appendChild(container);
      this.magnaSirgasFlag = false;
      switch (type) {
        case 'distance':
          this.activeWidget = new DistanceMeasurement2D({
            view: this.view,
            container: document.getElementById('divWidget')
          });
          this.activeWidget.viewModel.newMeasurement();
          this.setActiveButton(document.getElementById('distanceButton'));
          break;
        case 'area':
          this.activeWidget = new AreaMeasurement2D({
            view: this.view,
            container: document.getElementById('divWidget')
          });
          this.activeWidget.viewModel.newMeasurement();
          this.setActiveButton(document.getElementById('areaButton'));
          break;
        case 'coordinate':
          this.activeWidget = new CoordinateConversion({
            view: this.view,
            container: document.getElementById('divWidget')
          });
          this.setActiveButton(document.getElementById('coordinateButton'));
          break;
        case null:
          if (this.activeWidget) {
            this.activeWidget.destroy();
            this.activeWidget = null;
          }
          break;
      }
    });
  }

  public setActiveButton(selectedButton) {
    this.view.focus();
    const elements = document.getElementsByClassName('active');
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove('active');
    }
    if (selectedButton) {
      selectedButton.classList.add('active');
    }
  }


  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }

  async generateFeatureCollection(fileName, form, fileType) {
    const [esriRequest] = await loadModules(['esri/request']);
    let name = fileName.split('.');
    name = name[0].replace('c:\\fakepath\\', '');
    const params = {
      name,
      targetSR: this.view.spatialReference,
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
    esriRequest(this.sharingUrl + '/sharing/rest/content/features/generate', {
      query: myContent,
      body: form,
      responseType: 'json'
    }).then((response) => {
      if (fileType === 'shapefile') {
        this.addShapefileToMap(response);
      } else if (fileType === 'gpx') {
        this.addGpxToMap(response.data.featureCollection);
      }
      this.makingWork = false;
    }, (err) => {
      console.error(err);
    });

  }

  async addShapefileToMap(featureCollection) {
    const [FeatureLayer, Graphic, Field] = await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/layers/support/Field']);
    const layerName = featureCollection.data.featureCollection.layers[0].layerDefinition.name;
    let sourceGraphics = [];
    const layers = featureCollection.data.featureCollection.layers.map((layer) => {
      const graphics = layer.featureSet.features.map((feature) => {
        return Graphic.fromJSON(feature);
      });
      sourceGraphics = sourceGraphics.concat(graphics);
      const featureLayer = new FeatureLayer({
        title: layerName,
        objectIdField: 'FID',
        source: graphics,
        fields: layer.layerDefinition.fields.map((field) => {
          return Field.fromJSON(field);
        })
      });
      return featureLayer;
    });
    this.map.addMany(layers);
    this.view.goTo(sourceGraphics);
  }

  async addGpxToMap(featureCollection) {
    const [FeatureLayer, PopupTemplate, Graphic, Field, SimpleRenderer] =
      await loadModules([
        'esri/layers/FeatureLayer', 'esri/PopupTemplate', 'esri/Graphic', 'esri/layers/support/Field', 'esri/renderers/SimpleRenderer']);
    const filename = featureCollection.layers[0].featureSet.features[0].attributes.name;
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
    this.map.addMany(layers);
    this.view.goTo(sourceGraphics);
  }

  async addGeoJSONToMap(featureCollection) {
    const [Graphic, FeatureLayer, Field] = await loadModules(['esri/Graphic', 'esri/layers/FeatureLayer', 'esri/layers/support/Field']);
    let sourceGraphics = [];
    const graphics = featureCollection.features.map((feature) => {
      return Graphic.fromJSON(geojsonToArcGIS(feature));
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
      title: 'GeoJSON',
      source: graphics,
      fields
    });
    this.map.add(featureLayer);
    this.makingWork = false;
    this.view.goTo(sourceGraphics);
  }

  async addSlider() {
    const [Slider, FeatureLayer, LabelClass] =
      await loadModules(['esri/widgets/Slider', 'esri/layers/FeatureLayer', 'esri/layers/support/LabelClass']);
    this.service.getLayersOfServer(this.mapRestUrl, '?f=pjson').subscribe(success => {
      const timeStops = [];
      let layers = [];
      layers = success.layers;
      layers.forEach(layer => {
        this.nameLayer = layer.name;
        if (this.nameLayer.substr(0, 8).toUpperCase().startsWith('TIERRAS')) {
          const tierrasDate = this.nameLayer.substr(this.nameLayer.length - 10);
          const y = tierrasDate.substr(0, 4);
          const m = tierrasDate.substr(5, 2);
          const d = tierrasDate.substr(8, 2);
          const fecha = new Date(y + '/' + m + '/' + d);
          timeStops.unshift([layer.id, fecha]);
        }
      });
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const slider = new Slider({
        container: 'ts-tierras',
        min: 0,
        max: timeStops.length - 1,
        values: [timeStops.length - 1],
        steps: 1,
        labelsVisible: false
      });
      let d = timeStops[slider.values[0]][1];
      this.nameLayer = monthNames[d.getMonth()] + ' ' + d.getFullYear();
      let lyTierrasMdt;
      slider.on(['thumb-change', 'thumb-drag'], () => {
        const index = slider.values[0];
        d = timeStops[index][1];
        this.nameLayer = monthNames[d.getMonth()] + ' ' + d.getFullYear();
        const layerTierras = this.map.layers.items.find(x => x.id === 'Tierras');
        if (lyTierrasMdt !== undefined) {
          this.map.remove(lyTierrasMdt);
        }
        if (slider.values[0] < timeStops.length - 1) {
          layerTierras.visible = false;
          const lyTierrasMdtd = timeStops[index][0];
          lyTierrasMdt = new FeatureLayer(this.mapRestUrl + '/' + lyTierrasMdtd, {
            id: 'Tierras_MDT',
            opacity: 0.5,
            visible: true,
            outFields: ['*'],
            showAttribution: true,
            mode: FeatureLayer.MODE_ONDEMAND,
          });

          lyTierrasMdt.load().then(() => {
            let text = '';
            for (const field of lyTierrasMdt.fields) {
              text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
            }
            const templateTierras = {
              title: 'Información',
              content: text,
              fieldInfos: []
            };
            lyTierrasMdt.popupTemplate = templateTierras;
            const sourceSearch = this.sourceSearch.splice(0, 8);
            sourceSearch.push({
              layer: lyTierrasMdt,
              searchFields: ['TIERRAS_ID'],
              displayField: 'TIERRAS_ID',
              exactMatch: false,
              outFields: ['*'],
              name: lyTierrasMdt.title,
              suggestionsEnabled: true,
            });
            this.sourceSearch = null;
            this.sourceSearch = sourceSearch;
            this.search.sources = this.sourceSearch;
          });
          const statesLabelClass = new LabelClass({
            labelExpressionInfo: { expression: '$feature.TIERRAS_ID' },
            symbol: {
              type: 'text',  // autocasts as new TextSymbol()
              color: 'black',
              haloSize: 1,
              haloColor: 'white'
            }
          });

          lyTierrasMdt.labelingInfo = [statesLabelClass];

          this.map.add(lyTierrasMdt);
          (window as any).ga('send', 'event', 'TOOL', 'slide', 'ts-tierras');
        } else {
          layerTierras.visible = true;
        }
      });
    });
  }

  onChangeSelect() {
    if (this.selectedPolygon.value === 'free-pol') {
      this.sketch.create('polygon', { mode: 'freehand' });
    } else if (this.selectedPolygon.value === 'pol') {
      this.sketch.create('polygon', { mode: 'click' });
    }
  }

  async extratShape() {
    this.makingWork = true;
    const [FeatureSet, Geoprocessor] = await loadModules(['esri/tasks/support/FeatureSet', 'esri/tasks/Geoprocessor']);
    const gpExtract = new Geoprocessor({
      url: this.agsUrlBase + 'rest/services/ExtractShape/GPServer/ExtractShape',
      outSpatialReference: {
        wkid: 4326
      }
    });
    if (this.selectedLayers.length === 0 || this.selectedPolygon === undefined || this.view.graphics.length === 0) {
      if (this.selectedLayers.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: '',
          detail: 'Debe seleccionar las capas que desea extraer.'
        });
      }
      if (this.selectedPolygon === undefined) {
        this.messageService.add({
          severity: 'warn',
          summary: '',
          detail: 'Debe seleccionar elementos de la capa actual para poder extraer datos.'
        });
      }
      if (this.view.graphics.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: '',
          detail: 'Debe dibujar el área de interes para poder extraer datos.'
        });
      }
    } else {
      const features = this.view.graphics.items[0];
      const featureSet = new FeatureSet();
      featureSet.features = features;
      const params = {
        Layers_to_Clip: this.selectedLayers,
        Area_of_Interest: featureSet,
        Feature_Format: 'Shapefile - SHP - .shp'
      };
      gpExtract.submitJob(params).then((jobInfo) => {
        const options = {
          statusCallback: () => {
          }
        };
        gpExtract.waitForJobCompletion(jobInfo.jobId, options).then((jobInfo2) => {
          if (!jobInfo2.jobStatus.includes('fail')) {
            gpExtract.getResultData(jobInfo.jobId, 'Output_Zip_File').then((outputFile) => {
              const theurl = outputFile.value.url;
              window.location = theurl;
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: '',
              detail: 'Error al descargar la capa.'
            });
          }
          this.selectedLayers = [];
          this.selectedPolygon = undefined;
          this.clearGraphics();
        });
      });
      (window as any).ga('send', 'event', 'FORM', 'submit', 'extract');
    }
    this.makingWork = false;
  }

  public onRowSelect(event: any): void {
    loadModules(['esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
      'esri/Color', 'dojo/_base/array', 'esri/Graphic']).then(([SimpleFillSymbol, SimpleLineSymbol, Color,
        dojo, Graphic]) => {
        const layer = this.layerSelected;
        const query = layer.createQuery();
        query.where = `${this.columnsTable[0]} = ${event.data.attributes[this.columnsTable[0]]}`;
        query.returnGeometry = true;
        query.outFields = ['*'];
        layer.queryFeatures(query).then((res) => {
          const symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255, 1.0]), 2),
            new Color([0, 0, 0, 0.5]));
          dojo.forEach(res.features, (key) => {
            const graphic = new Graphic({
              geometry: key.geometry,
              symbol
            });
            this.view.graphics.add(graphic);
            const objectGraphic = {
              attr: event.data.attributes,
              graphic
            };
            this.graphics.push(objectGraphic);
          });
        }, (err) => {
          console.error(err);
        });
      });
  }

  public onHideDialogAtributos(): void {
    this.graphics = [];
    this.view.graphics.removeAll();
  }

  public dataKey(): string {
    return `attributes.${this.columnsTable[0]}`;
  }

  public onRowUnselect(event: any): void {
    for (const object of this.graphics) {
      if (object.attr !== undefined && object.attr === event.data.attributes) {
        this.view.graphics.remove(object.graphic);
        this.graphics.splice(this.graphics.indexOf(object), 1);
        break;
      }
    }
  }

  public generateAnalisisCobertura(): void {
    loadModules(['esri/tasks/support/FeatureSet', 'esri/tasks/Geoprocessor']).
      then(([, Geoprocessor]) => {
        this.makingWork = true;
        this.displayAnalisis = false;
        this.attributeTable.collapse();
        const gpIntersect = new Geoprocessor(this.agsUrlBase + 'rest/services/AnalisisCobertura/GPServer/AnalisisCobertura');
        gpIntersect.outSpatialReference = { wkid: 4326 };
        let nameDptos = '';
        (window as any).ga('send', 'event', 'BUTTON', 'click', 'intersect-start');
        for (const dpto of this.dptosSelected) {
          nameDptos = `${nameDptos}'${dpto.attributes.DEPARTAMEN}',`;
        }
        nameDptos = nameDptos.substr(0, nameDptos.length - 1);
        const params = {
          Nombres_Departamentos: nameDptos
        };
        gpIntersect.submitJob(params).then((jobInfo) => {
          const options = {
            statusCallback: () => {
            }
          };
          gpIntersect.waitForJobCompletion(jobInfo.jobId, options).then((jobInfo2) => {
            if (!jobInfo2.jobStatus.includes('fail')) {
              gpIntersect.getResultData(jobInfo.jobId, 'Output_Zip_File').then((outputFile) => {
                const theurl = outputFile.value.url;
                window.location = theurl;
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: '',
                detail: 'Error al generar analisis.'
              });
            }
            this.layerSelected = [];
            this.clearGraphics();
            this.makingWork = false;
          });
        });
      });
  }

  public nameDptoSelected(): string {
    let nameDptos = '';
    for (const dpto of this.dptosSelected) {
      nameDptos = `${nameDptos} ${dpto.attributes.DEPARTAMEN}`;
    }
    return nameDptos;
  }

  onHideDialogExtract() {
    this.clearGraphics();
    this.selectedLayers = [];
    this.selectedPolygon = undefined;
    this.sketch.cancel();
  }

  changeAttrTable() {
    console.log('Hola');
  }

  onHideDialogAnalisis() {
    this.layerSelected = [];
    this.attributeTable.collapse();
    this.displayAnalisis = false;
  }

  onChangeSelectSketchBuffer() {
    (window as any).ga('send', 'event', 'BUTTON', 'click', 'buffer');
    switch (this.selectedBufferSketch) {
      case 'line':
        this.sketchBuffer.create('polyline', { mode: 'freehand' });
        break;
      default:
        this.sketchBuffer.create(this.selectedBufferSketch);
        break;
    }
  }

  onHideDialogBuffer() {
    this.clearGraphics();
    this.selectedBuffer = undefined;
    this.selectedBufferSketch = undefined;
    this.bufDistance = undefined;
    this.sketchBuffer.cancel();
  }

  onShowAbout() {
    this.about = true;
  }

  onShowGuide() {
    this.guide = true;
  }

  public attrFilter(col: string): string {
    return `attributes.${col}`;
  }

  public generateExcelFeaturesLayer(): void {
    let attribute: Array<any> = [];
    for (const r of this.featureDptos) {
      let object = r.attributes;
      attribute.push(object);
    }
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      const EXCEL_EXTENSION = '.xlsx';
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(attribute);
      const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const dataBuffer: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
      FileSaver.saveAs(dataBuffer, this.layerSelected.title + EXCEL_EXTENSION);
  }
}
