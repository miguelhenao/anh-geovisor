import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService, SelectItem, MessageService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked, Query, AfterViewInit } from '@angular/core';
import { loadModules } from 'esri-loader';
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { DialogTerminosComponent } from '../dialog-terminos/dialog-terminos.component';
import { geojsonToArcGIS } from '@esri/arcgis-to-geojson-utils';
import { ImportCSV } from './ImportCSV';
import { DialogSymbologyChangeComponent } from '../dialog-symbology-change/dialog-symbology-change.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css'],
  providers: [DialogService, MessageService]
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  view: any = {
    ready: false
  };
  eventLayer: any;
  modalTable = false;
  modalMeasurement = false;
  modalAbout = false;
  modalGuide = false;
  modalExtract = false;
  modalAnalysis = false;
  modalBuffer = false;
  modalSelection = false;
  layerSelected: any;
  columnsTable: Array<any> = [];
  latitude = 4.6486259;
  longitude = -74.2478963;
  errorArcgisService = false;
  dptosSelected: Array<any> = [];
  makingWork = false;
  featureDptos: Array<any> = [];
  menu: Array<MenuItem> = [];
  departmentLayer: any;
  graphics: Array<any> = [];
  map: any;
  search: any;
  sourceSearch: Array<any> = [];
  attributeTable: any;
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
  // Url del servicio de impresión, por el momento no funciona
  // printUrl = this.agsUrlBase + 'rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task';
  // Url del servicio de impresión por defecto de Arcgis. Comentar o eliminar cuando funcione el servicio de ANH
  printUrl = 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';
  // Geometry Service
  urlGeometryService = this.agsUrlBase + 'rest/services/Utilities/Geometry/GeometryServer';
  // Url del servicio rest para generar un feature collection
  urlGenerateFeatureCollection = this.sharingUrl + '/sharing/rest/content/features/generate';
  // Url del servicio para extraer capa
  urlExtractShape = this.agsUrlBase + 'rest/services/ExtractShape/GPServer/ExtractShape';
  // Url del servicio para realizar el análisis de cobertura
  urlAnalisisCobertura = this.agsUrlBase + 'rest/services/AnalisisCobertura/GPServer/AnalisisCobertura';
  nameLayer: string;
  optionsPolygon = [
    { name: 'Polígono', value: 'pol' },
    { name: 'Polígono Libre', value: 'free-pol' }
  ];
  optionsBuffer = [
    { name: 'Kilómetros', value: 9036 },
    { name: 'Millas', value: 9093 },
    { name: 'Millas náuticas', value: 9030 },
    { name: 'Millas náuticas (US)', value: 109012 },
    { name: 'Metros', value: 9001 },
    { name: 'Pies', value: 9002 },
  ];
  featuresSelected: Array<any> = [];
  layerList: any;
  optionsLayers: SelectItem[] = [];
  optionsDepartment: SelectItem[] = [];
  sketch;
  sketchBuffer;
  sketchSelection;
  selectedPolygon: SelectItem;
  selectedSketch: any;
  intervalChange: any;
  levelColors: number = 0;
  indexColor: number = 0;
  items: MenuItem[];
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
  sectionSelected: string;
  modesBuffer: SelectItem[] = [
    { value: 'point', title: 'Punto', icon: 'fa fa-fw fa-circle' },
    { value: 'line', title: 'Línea', icon: 'esri-icon-minus' },
    { value: 'polyline', title: 'Polilínea', icon: 'esri-icon-polyline' },
    { value: 'rectangle', title: 'Rectángulo', icon: 'esri-icon-sketch-rectangle' },
    { value: 'polygon', title: 'Polígono', icon: 'esri-icon-polygon' }
  ];
  selectedMeasurement: any;
  modesMeasurement: SelectItem[] = [
    { value: 'area', title: 'Área', icon: 'fas fa-ruler-combined' },
    { value: 'distance', title: 'Distancia', icon: 'fas fa-ruler' },
    { value: 'coordinate', title: 'Ubicación', icon: 'esri-icon-map-pin' }
  ];
  colorsFirst: Array<any> = [];
  colorsSeconds: Array<any> = [];
  colorsThirst: Array<any> = [];
  colorsFourth: Array<any> = [];
  colorsFiveth: Array<any> = [];

  constructor(private dialogService: DialogService, private service: MapViewerService, private messageService: MessageService, private router: Router) {
    this.setCurrentPosition();
    this.colorsFirst = this.generateColor("#F8C933", "#FFE933", 50);
    this.colorsSeconds = this.generateColor("#E18230", "#F8C933", 50);
    this.colorsThirst = this.generateColor("#D75C31", "#E18230", 50);
    this.colorsFourth = this.generateColor("#CC3D36", "#D75C31", 50);
    this.colorsFiveth = this.generateColor("#44546A", "#FFE933", 50);
    var _this = this;
    this.changeColor(this.indexColor, this.colorsFirst);
    this.indexColor++;
    this.intervalChange = setInterval(function () {
      if (_this.indexColor >= 50) {
        _this.indexColor = 0;
        if (_this.levelColors > 5) {
          _this.levelColors = 1;
        } else {
          _this.levelColors++;
        }
      }
      switch (_this.levelColors) {
        case 1:
          _this.changeColor(_this.indexColor, _this.colorsFirst);
          break;
        case 2:
          _this.changeColor(_this.indexColor, _this.colorsSeconds);
          break;
        case 3:
          _this.changeColor(_this.indexColor, _this.colorsThirst);
          break;
        case 4:
          _this.changeColor(_this.indexColor, _this.colorsFourth);
          break;
        case 5:
          _this.changeColor(_this.indexColor, _this.colorsFiveth);
          break;
        default:
          break;
      }
      _this.indexColor++;
    }, 10);
    if (localStorage.getItem('agreeTerms') === undefined || localStorage.getItem('agreeTerms') === null) {
      this.dialogService.open(DialogTerminosComponent, {
        width: '80%',
        height: '80%',
        baseZIndex: 2000,
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
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogFileComponent, {
                  width: '400px',
                  baseZIndex: 20,
                  header: 'Cargar un archivo Shapefile',
                  data: { type: 'zip', help: this }
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
            }
          },
          {
            label: 'Archivo CSV',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogFileComponent, {
                  width: '400px',
                  baseZIndex: 20,
                  header: 'Cargar un archivo CSV',
                  data: { type: 'csv', help: this }
                });
                dialog.onClose.subscribe(res => {
                  if (res !== undefined) {
                    this.makingWork = true;
                    (window as any).ga('send', 'event', 'FORM', 'submit', 'upload-form-csv');
                    this.importCsv.uploadFileCsv(res.form.elements[0].files, res.data, this.urlGeometryService, this.map, this.view,
                      this.makingWork);
                  }
                });
              }
            }
          },
          {
            label: 'Archivo GPX',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogFileComponent, {
                  width: '400px',
                  baseZIndex: 20,
                  header: 'Cargar un archivo GPX',
                  data: { type: 'gpx', help: this }
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
            }
          },
          {
            label: 'Archivo GeoJSON',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogFileComponent, {
                  width: '400px',
                  baseZIndex: 20,
                  header: 'Cargar un archivo GeoJSON',
                  data: { type: 'json', help: this }
                });
                dialog.onClose.subscribe(res => {
                  if (res !== undefined) {
                    this.makingWork = true;
                    (window as any).ga('send', 'event', 'FORM', 'submit', 'upload-form-geojson');
                    this.addGeoJSONToMap(res);
                  }
                });
              }
            }
          },
          {
            label: 'Servicio KML',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                  width: '50%',
                  baseZIndex: 100,
                  header: 'Cargar servicio KML',
                  data: { help: this }
                });
                dialog.onClose.subscribe(res => {
                  if (res !== undefined) {
                    loadModules(['esri/layers/KMLLayer']).then(([KMLLayer]) => {
                      this.makingWork = true;
                      (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-kml');
                      const geo = new KMLLayer({
                        url: res
                      });
                      this.map.add(geo);
                    });
                  }
                });
              }
            }
          },
          {
            label: 'Servicio WMS',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                  width: '50%',
                  baseZIndex: 100,
                  header: 'Cargar servicio WMS',
                  data: { help: this }
                });
                dialog.onClose.subscribe(res => {
                  if (res !== undefined) {
                    loadModules(['esri/layers/WMSLayer']).then(([WMSLayer]) => {
                      this.makingWork = true;
                      (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-wms');
                      const wms = new WMSLayer({
                        url: res
                      });
                      this.map.add(wms);
                    });
                  }
                });
              }
            }
          },
          {
            label: 'Servicio GeoJSON',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                  width: '50%',
                  baseZIndex: 100,
                  header: 'Cargar servicio GeoJSON',
                  data: { help: this }
                });
                dialog.onClose.subscribe(res => {
                  if (res !== undefined) {
                    loadModules(['esri/layers/GeoJSONLayer']).then(([GeoJSONLayer]) => {
                      this.makingWork = true;
                      (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-geojson');
                      const geo = new GeoJSONLayer({
                        url: res
                      });
                      this.map.add(geo);
                    });
                  }
                });
              }
            }
          },
          {
            label: 'Servicio CSV',
            command: () => {
              if (!this.errorArcgisService) {
                const dialog = this.dialogService.open(DialogUrlServiceComponent, {
                  width: '50%',
                  baseZIndex: 100,
                  header: 'Cargar servicio CSV',
                  data: { help: this }
                });
                dialog.onClose.subscribe(res => {
                  if (res !== undefined) {
                    loadModules(['esri/layers/CSVLayer']).then(([CSVLayer]) => {
                      this.makingWork = true;
                      (window as any).ga('send', 'event', 'FORM', 'submit', 'services-form-csv');
                      const csv = new CSVLayer({
                        url: res
                      });
                      this.map.add(csv);
                    });
                  }
                });
              }
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
              if (!this.errorArcgisService) {
                this.optionsLayers = [];
                this.map.layers.items.forEach((layer) => {
                  if (layer.title !== null) {
                    this.optionsLayers.push({
                      label: layer.title.substr(11),
                      value: layer.title.substr(11)
                    });
                  }
                });
                this.visibleModal(false, false, false, true, false, false, false, false);
                this.view.popup.autoOpenEnabled = false;
              }
            }
          }
        ]
      },
      {
        label: 'Herramientas',
        icon: 'fa fa-wrench',
        items: [
          {
            label: 'Zona de Influencia (Buffer)',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, true, false, false, false, false, false);
                this.view.popup.autoOpenEnabled = false;
              }
            }
          },
          {
            label: 'Herramientas de Medición',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, true, false, false);
                this.view.popup.autoOpenEnabled = false;
                (window as any).ga('send', 'event', 'BUTTON', 'click', 'open-measure-menu');
              }
            }
          }
        ]
      },
      {
        label: 'Impresión',
        icon: 'fa fa-print',
        command: () => {
          if (!this.errorArcgisService) {
            (window as any).ga('send', 'event', 'BUTTON', 'click', 'print');
            window.print();
          }
        }
      },
      {
        icon: 'esri-icon-expand',
        title: 'Expandir/Contraer',
        command: () => {
          this.retractMenu();
          if (this.visibleMenu) {
            document.getElementsByClassName('esri-icon-collapse')[0].classList.add('esri-icon-expand');
            document.getElementsByClassName('esri-icon-expand')[0].classList.remove('esri-icon-collapse');
          } else {
            document.getElementsByClassName('esri-icon-expand')[0].classList.add('esri-icon-collapse');
            document.getElementsByClassName('esri-icon-collapse')[0].classList.remove('esri-icon-expand');
          }
        }
      }
    ];
  }

  ngAfterViewChecked() {
    const layerList: HTMLCollection = document.getElementsByClassName('esri-expand__panel');
    for (let index = 0; index < layerList.length; index++) {
      const element = layerList[index];
      element.addEventListener('click', this.clickItemExpand);
    }
  }

  clickItemExpand: (arg0: any) => void = (event: any): void => {
    if (event.srcElement.className.includes('layer-list')) {
      (window as any).ga('send', 'event', 'BUTTON', 'click', 'legend-button');
    } else if (event.srcElement.className.includes('layers')) {
      (window as any).ga('send', 'event', 'BUTTON', 'click', 'toc-button');
    } else if (event.srcElement.className.includes('question')) {
      (window as any).ga('send', 'event', 'BUTTON', 'click', 'help-button');
    }
  }

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

  /**
   * Método encargado de la inicialización del mapa con sus capas
   */
  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [Map, MapView, FeatureLayer, LayerList, Print, Search, Expand, LabelClass, BasemapGallery, SketchViewModel,
        GraphicsLayer, Graphic, Legend, ScaleBar, ListItem, geometryEngine, SpatialReference, ProjectParameters, GeometryService,
        Widget] =
        await loadModules(['esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer', 'esri/widgets/LayerList', 'esri/widgets/Print',
          'esri/widgets/Search', 'esri/widgets/Expand', 'esri/layers/support/LabelClass', 'esri/widgets/BasemapGallery',
          'esri/widgets/Sketch/SketchViewModel', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/widgets/Legend',
          'esri/widgets/ScaleBar', 'esri/widgets/LayerList/ListItem', 'esri/geometry/geometryEngine', 'esri/geometry/SpatialReference',
          'esri/tasks/support/ProjectParameters', 'esri/tasks/GeometryService', 'esri/widgets/Widget']);

      // Geometry Service
      const geomSvc = new GeometryService(this.urlGeometryService);
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
        zoom: 6,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);


      this.addSlider();
      // Carga de capa de pozo
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
        const searchField: Array<any> = [];
        for (const field of lyPozo.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templatePozo = {
          title: lyPozo.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyPozo,
          searchFields: searchField,
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
      // Carga de capa rezumadero
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
        const searchField: Array<any> = [];
        for (const field of lyRezumadero.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateRezumadero = {
          title: lyRezumadero.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyRezumadero,
          searchFields: searchField,
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
      // Carga de capa sismica
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
        const searchField: Array<any> = [];
        for (const field of lySismica.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSismica = {
          title: lySismica.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySismica,
          searchFields: searchField,
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
      // Carga de capa sismica 3D
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
        const searchField: Array<any> = [];
        for (const field of lySismica3d.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSismica3d = {
          title: lySismica3d.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySismica3d,
          searchFields: searchField,
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
      // Carga de capa de municipio
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
        const searchField: Array<any> = [];
        for (const field of lyMunicipio.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateMunicipio = {
          title: lyMunicipio.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyMunicipio,
          searchFields: searchField,
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
      // Carga de capa de departamento
      const lyDepartamento = new FeatureLayer(this.mapRestUrl + '/4', {
        id: 'Departamento',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      lyDepartamento.load().then(() => {
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lyDepartamento.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyDepartamento,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lyDepartamento.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        const templateDepartamento = {
          title: lyDepartamento.title,
          content: text,
          fieldInfos: []
        };
        lyDepartamento.popupTemplate = templateDepartamento;
      });
      this.map.add(lyDepartamento);
      // Carga de capa de cuencas
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
        const searchField: Array<any> = [];
        for (const field of lyCuencas.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateCuencas = {
          title: lyCuencas.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyCuencas,
          searchFields: searchField,
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
      // Carga de capa de tierras
      const lyTierras = new FeatureLayer(this.mapRestUrl + '/8', {
        id: 'Tierras',
        opacity: 0.5,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      lyTierras.load().then(() => {
        const searchField: Array<any> = [];
        let text = '';
        this.layerSelected = lyTierras;
        for (const field of lyTierras.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateTierras = {
          title: lyTierras.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyTierras,
          searchFields: searchField,
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
          type: 'text',
          color: 'black',
          haloSize: 1,
          haloColor: 'white'
        }
      });
      lyTierras.labelingInfo = [statesLabelClass];
      this.map.add(lyTierras);
      // Carga de capa de sensibilidad
      const lySensibilidad = new FeatureLayer(this.mapRestUrl + '/7', {
        labelExpressionInfo: { expression: '$feature.CONTRAT_ID' },
        id: 'Sensibilidad',
        opacity: 0.5,
        visible: false,
        outFields: ['*'],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      lySensibilidad.load().then(() => {
        const searchField: Array<any> = [];
        let text = '';
        this.layerSelected = lyTierras;
        for (const field of lySensibilidad.fields) {
          searchField.push(field.name);
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSensibilidad = {
          title: lySensibilidad.title,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySensibilidad,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lySensibilidad.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lySensibilidad.popupTemplate = templateSensibilidad;
      });
      lySensibilidad.labelingInfo = [statesLabelClass];
      this.map.add(lySensibilidad);
      this.view.on('click', (e) => {
        if (this.activeWidget !== undefined && this.activeWidget !== null && this.activeWidget.viewModel.mode !== undefined) {
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
        if (this.makingWork) {
          this.makingWork = false;
        }
      });
      this.view.on('layerview-create-error', (e) => {
        this.messageService.add({ detail: `Error cargando la capa ${e.layer.id}`, summary: 'Carga de capas', severity: 'error' });
      });
      // Widget de LayerList
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
              },
              {
                title: 'Cambiar simbología',
                className: 'esri-icon-edit',
                id: 'simbologia'
              },
              {
                title: 'Selección',
                className: 'esri-icon-cursor',
                id: 'seleccion'
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
              },
              {
                title: 'Cambiar simbología',
                className: 'esri-icon-edit',
                id: 'simbologia'
              },
              {
                title: 'Selección',
                className: 'esri-icon-cursor',
                id: 'seleccion'
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
            (window as any).ga('send', 'event', 'BUTTON', 'click', 'att-table-button');
            const query = {
              outFields: ['*'],
              returnGeometry: false,
              where: ''
            };
            layer.queryFeatures(query).then((result) => {
              this.featureDptos = result.features;
              this.columnsTable = Object.keys(this.featureDptos[0].attributes);
              this.layerSelected = layer;
              layerListExpand.collapse();
              this.visibleModal(false, false, false, false, false, false, true, false);
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
              this.columnsTable = Object.keys(this.featureDptos[0].attributes);
              this.dptosSelected = [];
              this.layerSelected = layer;
              layerListExpand.collapse();
              this.visibleModal(false, true, false, false, false, false, false, false);
            }, (err) => {
              console.log(err);
            });
          } else if (event.action.id === 'simbologia') {
            layerListExpand.collapse();
            const dialog = this.dialogService.open(DialogSymbologyChangeComponent, {
              width: '25%',
              header: `Cambio de Simbología ${layer.title}`,
              data: { help: this }
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
          } else if (event.action.id === 'increase-opacity') {
            layer.opacity += 0.25;
          } else if (event.action.id === 'decrease-opacity') {
            layer.opacity -= 0.25;
          } else if (event.action.id === 'seleccion') {
            this.featureDptos = [];
            this.visibleModal(false, false, false, false, false, false, false, true);
            this.layerSelected = layer;
            layerListExpand.collapse();
          }
        });
      });

      const layerListExpand = new Expand({
        expandIconClass: 'esri-icon-layers',
        expandTooltip: 'Tabla de contenido',
        view: this.view,
        content: layerList,
        group: 'expand',
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
        printServiceUrl: this.printUrl
      });
      const expandPrint = new Expand({
        expandIconClass: 'fa fa-file-export',
        expandTooltip: 'Exportar',
        view: this.view,
        content: print,
        group: 'expand'
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
        group: 'expand'
      });
      const basemapGallery = new BasemapGallery({
        view: this.view
      });
      const expandBaseMapGallery = new Expand({
        expandIconClass: 'esri-icon-basemap',
        expandTooltip: 'Mapa base',
        view: this.view,
        content: basemapGallery,
        group: 'expand'
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

      this.sketchSelection = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });

      this.sketchSelection.on('create', (event) => {
        if (event.state === 'complete') {
          this.makingWork = true;
          const spQry = this.layerSelected.createQuery();
          spQry.maxAllowableOffset = 1;
          spQry.geometry = event.graphic.geometry;
          this.layerSelected.queryFeatures(spQry).then((result) => {
            if (result.features.length === 0) {
              this.makingWork = false;
            }
            this.clearGraphics();
            this.featureDptos = result.features;
            this.messageService.add({
              severity: 'info',
              summary: '',
              detail: `Se seleccionaron ${result.features.length} elementos de la capa ${this.layerSelected.id}
                        y se cargaron sus atributos.`
            });
            this.columnsTable = Object.keys(this.featureDptos[0].attributes);
            layerListExpand.collapse();
            loadModules(['esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
              'esri/Color', 'dojo/_base/array', 'esri/Graphic']).then(([SimpleFillSymbol, SimpleLineSymbol, Color,
                dojo, Graphic]) => {
                const symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                  new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255, 1.0]), 2),
                  new Color([0, 0, 0, 0.5]));
                dojo.forEach(result.features, (key) => {
                  const graphic = new Graphic({
                    geometry: key.geometry,
                    symbol
                  });
                  this.view.graphics.add(graphic);
                });
                this.clearGraphic = true;
                this.makingWork = false;
                this.visibleModal(false, false, false, false, false, false, true, true);
              });
          });
          this.onChangeSelectedSketchSelection();
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
        group: 'expand',
        expandTooltip: 'Ayuda'
      });
      this.attributeTable = attributeTable;
      this.view.ui.add([expandPrint, expandBaseMapGallery, expandLegend, layerListExpand, help], 'top-right');
      return this.view;
    } catch (error) {
      console.log('EsriLoader: ', error);
    }
  }

  /**
   * Limpia los graficos de la vista
   */
  clearGraphics() {
    this.view.graphics.removeAll();
    this.clearGraphic = false;
  }

  ngOnInit() {
    this.service.validateServices(this.mapRestUrl).subscribe(success => {
      // console.log(success);
    }, error => {
      this.errorArcgisService = true;
      console.log(error);
    });
    this.initializeMap();
    this.items = [
      {
        label: 'TV', icon: 'fa fa-fw fa-check',
        items: [
          [
            {
              label: 'TV 1',
              items: [{ label: 'TV 1.1' }, { label: 'TV 1.2' }]
            },
            {
              label: 'TV 2',
              items: [{ label: 'TV 2.1' }, { label: 'TV 2.2' }]
            }
          ],
          [
            {
              label: 'TV 3',
              items: [{ label: 'TV 3.1' }, { label: 'TV 3.2' }]
            },
            {
              label: 'TV 4',
              items: [{ label: 'TV 4.1' }, { label: 'TV 4.2' }]
            }
          ]
        ]
      },
      {
        label: 'Sports', icon: 'fa fa-fw fa-soccer-ball-o',
        items: [
          [
            {
              label: 'Sports 1',
              items: [{ label: 'Sports 1.1' }, { label: 'Sports 1.2' }]
            },
            {
              label: 'Sports 2',
              items: [{ label: 'Sports 2.1' }, { label: 'Sports 2.2' }]
            },

          ],
          [
            {
              label: 'Sports 3',
              items: [{ label: 'Sports 3.1' }, { label: 'Sports 3.2' }]
            },
            {
              label: 'Sports 4',
              items: [{ label: 'Sports 4.1' }, { label: 'Sports 4.2' }]
            }
          ],
          [
            {
              label: 'Sports 5',
              items: [{ label: 'Sports 5.1' }, { label: 'Sports 5.2' }]
            },
            {
              label: 'Sports 6',
              items: [{ label: 'Sports 6.1' }, { label: 'Sports 6.2' }]
            }
          ]
        ]
      },
      {
        label: 'Entertainment', icon: 'fa fa-fw fa-child',
        items: [
          [
            {
              label: 'Entertainment 1',
              items: [{ label: 'Entertainment 1.1' }, { label: 'Entertainment 1.2' }]
            },
            {
              label: 'Entertainment 2',
              items: [{ label: 'Entertainment 2.1' }, { label: 'Entertainment 2.2' }]
            }
          ],
          [
            {
              label: 'Entertainment 3',
              items: [{ label: 'Entertainment 3.1' }, { label: 'Entertainment 3.2' }]
            },
            {
              label: 'Entertainment 4',
              items: [{ label: 'Entertainment 4.1' }, { label: 'Entertainment 4.2' }]
            }
          ]
        ]
      },
      {
        label: 'Technology', icon: 'fa fa-fw fa-gears',
        items: [
          [
            {
              label: 'Technology 1',
              items: [{ label: 'Technology 1.1' }, { label: 'Technology 1.2' }]
            },
            {
              label: 'Technology 2',
              items: [{ label: 'Technology 2.1' }, { label: 'Technology 2.2' }]
            },
            {
              label: 'Technology 3',
              items: [{ label: 'Technology 3.1' }, { label: 'Technology 3.2' }]
            }
          ],
          [
            {
              label: 'Technology 4',
              items: [{ label: 'Technology 4.1' }, { label: 'Technology 4.2' }]
            }
          ]
        ]
      }
    ];
  }

  public changeColor(indexColor: number, colors: Array<any>): void {
    document.getElementsByClassName("ui-progressbar")[0] != undefined ? document.getElementsByClassName("ui-progressbar")[0].setAttribute('style', `height: 6px; background: #${colors[indexColor]} !important; margin-top: 18px; margin-left: -72px;`) : null;
  }
  public hex(c: any): string {
    let s = "0123456789abcdef";
    let i = parseInt(c);
    if (i == 0 || isNaN(c))
      return "00";
    i = Math.round(Math.min(Math.max(0, i), 255));
    return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
  }

  public convertToHex(rgb: any): string {
    return this.hex(rgb[0]) + this.hex(rgb[1]) + this.hex(rgb[2]);
  }

  public trim(s): string {
    return (s.charAt(0) == '#') ? s.substring(1, 7) : s
  }

  public convertToRGB(hex): Array<any> {
    let color = [];
    color[0] = parseInt((this.trim(hex)).substring(0, 2), 16);
    color[1] = parseInt((this.trim(hex)).substring(2, 4), 16);
    color[2] = parseInt((this.trim(hex)).substring(4, 6), 16);
    return color;
  }

  public generateColor(colorStart, colorEnd, colorCount): Array<any> {
    let start = this.convertToRGB(colorStart);
    let end = this.convertToRGB(colorEnd);
    let len = colorCount;
    let alpha = 0.0;
    let salida = [];
    for (let i = 0; i < len; i++) {
      let c = [];
      alpha += (1.0 / len);
      c[0] = start[0] * alpha + (1 - alpha) * end[0];
      c[1] = start[1] * alpha + (1 - alpha) * end[1];
      c[2] = start[2] * alpha + (1 - alpha) * end[2];
      salida.push(this.convertToHex(c));
    }
    return salida;
  }

  ngOnDestroy() {
    if (this.view) {
      this.view.container = null;
    }
  }

  /**
   * Método que se realiza cuando el dialogo de medición es cerrado
   */
  public onHideDialogMedicion(): void {
    this.selectedMeasurement = null;
    this.setActiveWidget();
    this.view.popup.autoOpenEnabled = true;
  }

  /**
   * Método con el cual se identifica cual fue el tipo de medición seleccionado por el usuario
   */
  public setActiveWidget() {
    loadModules(['esri/widgets/DistanceMeasurement2D', 'esri/widgets/AreaMeasurement2D', 'esri/widgets/CoordinateConversion']).then((
      [DistanceMeasurement2D, AreaMeasurement2D, CoordinateConversion]) => {
      this.activeWidget != null ? this.activeWidget.destroy() : null;
      this.activeWidget = null;
      const container = document.createElement('div');
      container.id = 'divWidget';
      document.getElementById('widgetMeasure') != null ? document.getElementById('widgetMeasure').appendChild(container) : null;
      this.magnaSirgasFlag = false;
      switch (this.selectedMeasurement) {
        case 'distance':
          this.activeWidget = new DistanceMeasurement2D({
            view: this.view,
            container: document.getElementById('divWidget')
          });
          this.activeWidget.viewModel.newMeasurement();
          break;
        case 'area':
          this.activeWidget = new AreaMeasurement2D({
            view: this.view,
            container: document.getElementById('divWidget')
          });
          this.activeWidget.viewModel.newMeasurement();
          break;
        case 'coordinate':
          this.activeWidget = new CoordinateConversion({
            view: this.view,
            container: document.getElementById('divWidget')
          });
          const symbol = {
            type: 'picture-marker',  // autocasts as new PictureMarkerSymbol()
            url: 'assets/marker.png',
            width: '18px',
            height: '32px',
            yoffset: '16px'
          };
          this.activeWidget.viewModel.locationSymbol = symbol;
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
    esriRequest(this.urlGenerateFeatureCollection, {
      query: myContent,
      body: form,
      responseType: 'json'
    }).then((response) => {
      if (fileType === 'shapefile') {
        this.addShapefileToMap(response);
      } else if (fileType === 'gpx') {
        this.addGpxToMap(response.data.featureCollection);
      }
    }, (err) => {
      this.makingWork = false;
      console.error(err);
      this.messageService.add({ summary: 'Error de carga', detail: 'No se pudo realizar la petición de carga de capa', severity: 'error' });
    });
  }

  /**
   * Método encargado de construir un layer de acuerdo a un archivo shapefile
   * @param featureCollection -> Lista de features para construir el layer
   */
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

  /**
   * Método encargado de la construcción de un layer segun un archivo GPX
   * @param featureCollection -> Lista de features para construir el layer
   */
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
    this.view.goTo(sourceGraphics);
  }

  /**
   * Método encargado de inicializar el Slider de tierras y de dar funcionalidad al mismo
   */
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
        labelsVisible: false,
        rangeLabelsVisible: true
      });
      const minValueSlider = document.getElementsByClassName('esri-slider__min')[0];
      minValueSlider.textContent = timeStops[0][1].getFullYear();
      const maxValueSlider = document.getElementsByClassName('esri-slider__max')[0];
      maxValueSlider.textContent = timeStops[timeStops.length - 1][1].getFullYear();
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
              type: 'text',
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
    }, error => {
      console.log(error);
    });
  }

  /**
   * Método que se ejecuta cuando se cambia la selección de poligono en el sketch
   */
  onChangeSelect() {
    if (this.selectedPolygon.value === 'free-pol') {
      this.sketch.create('polygon', { mode: 'freehand' });
    } else if (this.selectedPolygon.value === 'pol') {
      this.sketch.create('polygon', { mode: 'click' });
    }
  }

  /**
   * Método encargado de la funcionalidad de extraer datos a un archivo Shapefile
   */
  async extratShape() {
    this.makingWork = true;
    const [FeatureSet, Geoprocessor] = await loadModules(['esri/tasks/support/FeatureSet', 'esri/tasks/Geoprocessor']);
    const gpExtract = new Geoprocessor({
      url: this.urlExtractShape,
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
          this.makingWork = false;
        }, (error) => {
          this.messageService.add({
            severity: 'error',
            summary: '',
            detail: 'Error al descargar la capa.'
          });
          this.makingWork = false;
        });
      }, (error) => {
        this.makingWork = false;
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: 'Error al descargar la capa.'
        });
      });
      (window as any).ga('send', 'event', 'FORM', 'submit', 'extract');
    }
  }

  /**
   * Método que se ejecuta cuando un item de la tabla de atributos es seleccionado
   * @param event -> Evento con el item de la tabla seleccionado
   */
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
          this.messageService.add({ summary: 'Error de selección', detail: `No se pudo seleccionar el objeto de la capa ${layer.id}`, severity: 'error' });
        });
      });
  }

  /**
   * Método que se ejecuta cuando el dialogo de tabla de atributos es cerrado
   */
  public onHideDialogAtributos(): void {
    this.graphics = [];
    this.clearGraphics();
  }

  /**
   * Retorna el data key de la tabla de atributos
   */
  public dataKey(): string {
    return `attributes.${this.columnsTable[0]}`;
  }

  /**
   * Método que se ejecuta cuando un elemento de la tabla de atributos es deseleccionado
   * @param event -> Evento que contiene el dato deseleccionado
   */
  public onRowUnselect(event: any): void {
    for (const object of this.graphics) {
      if (object.attr !== undefined && object.attr === event.data.attributes) {
        this.view.graphics.remove(object.graphic);
        this.graphics.splice(this.graphics.indexOf(object), 1);
        break;
      }
    }
  }

  /**
   * Método encargado de realizar el análisis de cobertura
   */
  public generateAnalisisCobertura(): void {
    loadModules(['esri/tasks/support/FeatureSet', 'esri/tasks/Geoprocessor']).
      then(([, Geoprocessor]) => {
        this.makingWork = true;
        this.modalAnalysis = false;
        this.attributeTable.collapse();
        const gpIntersect = new Geoprocessor(this.urlAnalisisCobertura);
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

  /**
   * Retorna los nombres de los departamentos seleccionados en el analisis de cobertura
   */
  public nameDptoSelected(): string {
    let nameDptos = '';
    for (const dpto of this.dptosSelected) {
      nameDptos = `${nameDptos} ${dpto.attributes.DEPARTAMEN}`;
    }
    return nameDptos;
  }

  /**
   * Metodo que se realiza cuando se cierra el dialogo de extracción de datos
   */
  onHideDialogExtract() {
    this.clearGraphics();
    this.selectedLayers = [];
    this.selectedPolygon = undefined;
    this.sketch.cancel();
    this.view.popup.autoOpenEnabled = true;
  }

  changeAttrTable(event: any) {
    const ev = {
      data: {
        attributes: event.itemValue.attributes
      }
    };
    if (event.value.indexOf(event.itemValue) !== -1) {
      // Añadir
      console.log('Añadio');
      this.onRowSelect(ev);
    } else {
      // Remover
      console.log('Remover');
      this.onRowUnselect(ev);
    }
  }

  /**
   * Metodo que se realiza cuando se cierra el dialogo de analisis de cobertura
   */
  onHideDialogAnalisis() {
    this.featuresSelected = [];
    this.attributeTable.collapse();
    this.clearGraphics();
    this.modalAnalysis = false;
  }

  /**
   * Detecta cambio de herramienta de dibujo en el sketch de zona de influencia
   */
  onChangeSelectedSketchBuffer() {
    (window as any).ga('send', 'event', 'BUTTON', 'click', 'buffer');
    switch (this.selectedSketch) {
      case 'line':
        this.sketchBuffer.create('polyline', { mode: 'freehand' });
        break;
      default:
        this.sketchBuffer.create(this.selectedSketch);
        break;
    }
  }

  /**
   * Metodo que se realiza cuando el dialogo de zona de influencia es cerrado
   */
  onHideDialogBuffer() {
    this.clearGraphics();
    this.selectedBuffer = undefined;
    this.selectedSketch = undefined;
    this.bufDistance = undefined;
    this.sketchBuffer.cancel();
    this.view.popup.autoOpenEnabled = true;
  }

  /**
   * Muestra el "acerca de" del Geovisor
   */
  onShowAbout() {
    this.visibleModal(true, false, false, false, false, false, false, false);
  }

  /**
   * Muestra la guia del Geovisor
   */
  onShowGuide() {
    this.sectionSelected = 'h-introduccion';
    this.visibleModal(false, false, false, false, true, false, false, false);
    (window as any).ga('send', 'event', 'BUTTON', 'click', 'ayuda');
  }

  /**
   * Retorna el nombre completo de filtro de la columna en la tabla de atributos
   * @param col -> Nombre de la columna
   */
  public attrFilter(col: string): string {
    return `attributes.${col}`;
  }

  /**
   * Genera archivo excel de los features de un layer seleccionado
   */
  public generateExcelFeaturesLayer(): void {
    const attribute: Array<any> = [];
    for (const r of this.featureDptos) {
      const object = r.attributes;
      attribute.push(object);
    }
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(attribute);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBuffer: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(dataBuffer, this.layerSelected.title + EXCEL_EXTENSION);
  }

  /**
   * @param about -> Bandera para dialog About
   * @param analysis -> Bandera para dialog Analisis de cobertura
   * @param buffer -> Bandera para dialog Zona de influencia
   * @param extract -> Bandera para dialog Extraer capa
   * @param guide -> Bandera para dialog Guía
   * @param measurement -> Bandera para dialog Herramientas de medición
   * @param table -> Bandera para dialog Tabla de atributos
   */
  public visibleModal(about: boolean, analysis: boolean, buffer: boolean, extract: boolean, guide: boolean, measurement: boolean, table: boolean, selection: boolean) {
    this.modalAbout = about;
    this.modalAnalysis = analysis;
    this.modalBuffer = buffer;
    this.modalExtract = extract;
    this.modalGuide = guide;
    this.modalMeasurement = measurement;
    this.modalTable = table;
    this.modalSelection = selection;
  }
  /**
   *
   * @param value -> Variable de control para menú
   */
  public onAccordion(value: boolean) {
    this.visibleMenu = value;
  }

  /**
   * Metodo que se realiza cuando cambia el sketch para Herramientas de seleccion
   */
  public onChangeSelectedSketchSelection() {
    switch (this.selectedSketch) {
      case 'line':
        this.sketchSelection.create('polyline', { mode: 'freehand' });
        break;
      default:
        this.sketchSelection.create(this.selectedSketch);
        break;
    }
  }

  /**
   *  Metodo que se realiza cuando se cierra el dialog de Herramientas de selección
   */
  public onHideDialogSelection() {
    this.clearGraphics();
    this.sketchSelection.cancel();
    this.selectedSketch = null;
  }


  public getNameLayer(): string {
    return this.layerSelected != undefined || this.layerSelected != null ? this.layerSelected.title : null;
  }

  public requestHelp(modal: string): void {
    console.log(modal);
    this.sectionSelected = modal;
    switch (modal) {
      case 'buffer':
        this.visibleModal(false, false, true, false, true, false, false, false);
        break;
      case 'h-medir':
        this.visibleModal(false, false, false, false, true, true, false, false);
        break;
      case 'h-extraer':
        this.visibleModal(false, false, false, true, true, false, false, false);
        break;
      default:
        this.modalGuide = true;
        break;
    }
  }

  /**
   * Retracta menu dejando solo visibles los iconos
   */
  public retractMenu(): void {
    this.visibleMenu = !this.visibleMenu;
    var elements = document.getElementsByClassName('ui-menuitem-text');
    var icons = document.getElementsByClassName('ui-submenu-icon pi pi-fw pi-caret-right ng-star-inserted');
    var menu = document.getElementsByClassName('ui-tieredmenu')[0];
    if (elements != null && elements != undefined) {
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        if (this.validateHiddenElement(element.textContent)) {
          if (this.visibleMenu) {
            menu.setAttribute('style', 'padding: 0; background-color: #ffffff; border: none; width: auto;');
            element.setAttribute('style', 'display: initial;');
          } else {
            menu.setAttribute('style', 'padding: 0; background-color: #ffffff; border: none; width: 45px;');
            element.setAttribute('style', 'display: none;');
          }
        }
      }
    }
    if (icons != null && icons != undefined) {
      for (let index = 0; index < icons.length; index++) {
        const element = icons[index];
        if (this.visibleMenu) {
          element.setAttribute('style', 'display: initial;');
        } else {
          element.setAttribute('style', 'display: none;');
        }
      }
    }
  }

  public validateHiddenElement(menu: string): boolean {
    let isValid: boolean = false;
    for (const item of this.menu) {
      if (item.label == menu) {
        isValid = true;
        break
      }
    }
    return isValid;
  }
}
