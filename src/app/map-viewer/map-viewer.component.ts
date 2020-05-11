import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, SelectItem, MessageService, ConfirmationService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { loadModules } from 'esri-loader';
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { DialogTerminosComponent } from '../dialog-terminos/dialog-terminos.component';
import { geojsonToArcGIS } from '@esri/arcgis-to-geojson-utils';
import { ImportCSV } from './ImportCSV';
import { DialogSymbologyChangeComponent } from '../dialog-symbology-change/dialog-symbology-change.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { Table } from "primeng/table";
import { format, resolve } from 'url';
import { Dialog } from 'primeng/dialog/dialog';

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
  @ViewChild('dt', { static: false }) attrTable: Table;
  @ViewChild('attr', { static: false }) attr: Dialog;
  loaded = false;
  eventLayer: any;
  modalTable = false;
  minimizeMaximize = true;
  modalFilter = false;
  modalMeasurement = false;
  modalAbout = false;
  modalGuide = false;
  modalExtract = false;
  layersOptionsList: Array<any> = [];
  layerExtract = false;
  sourceLayer: Array<any> = [];
  modalAnalysis = false;
  heightTable: number;
  modalBuffer = false;
  infoTool = true;
  modalSelection = false;
  selectDpto: Array<any> = [];
  makingWorkFromAttr = false;
  modalCoordinate = false;
  layerSelected: any;
  layerAttrTable: any;
  currentLayer: any;
  layerSelectedSelection: string;
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
  graphicGoTo: any;
  map: any;
  search: any;
  sourceSearch: Array<any> = [];
  activeWidget: any;
  tsLayer: any;
  legend: any;
  expandPrint: any;
  coordsWidget: any;
  agsHost = 'anh-gisserver.anh.gov.co';
  // agsHost = 'services6.arcgis.com/QNcm0ph3xAgJ1Ghk';
  agsProtocol = 'https';
  mapRestUrl = this.agsProtocol + '://' + this.agsHost + '/arcgis/rest/services/Tierras/Mapa_ANH/MapServer';
  // mapRestUrl = this.agsProtocol + '://' + this.agsHost + '/arcgis/rest/services/Tierras_2019_09_17/FeatureServer';
  agsDir = 'arcgis';
  agsUrlBase = this.agsProtocol + '://' + this.agsHost + '/' + this.agsDir + '/';
  // Url servidor ArcGIS.com para servicios de conversión (sharing)
  sharingUrl = 'https://www.arcgis.com'; // importante que sea https para evitar problemas de SSL
  // Url del servicio de impresión, por el momento no funciona
  printUrl = this.agsUrlBase + 'rest/services/ExportWebMap_10/GPServer/Export%20Web%20Map';
  //printUrl = this.agsUrlBase + 'rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task';
  // Url del servicio de impresión por defecto de Arcgis. Comentar o eliminar cuando funcione el servicio de ANH
  // printUrl = 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';
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
    { name: 'Polígono Rectangular', value: 'rectangle' },
    { name: 'Polígono Libre', value: 'free-pol' },
    { name: 'Entidad', value: 'entity' }
  ];
  optionsBuffer = [
    { name: 'Kilómetros', value: 9036 },
    { name: 'Millas', value: 9093 },
    { name: 'Millas náuticas', value: 9030 },
    { name: 'Millas náuticas (US)', value: 109012 },
    { name: 'Metros', value: 9001 },
    { name: 'Pies', value: 9002 },
  ];
  optionsCoordinateUnits = [
    {
      name: 'Grados, Minutos y Segundos ( ej. 04° 35\' 46,3215" )',
      value: [{ label: 'MAGNA-SIRGAS (WGS84)', value: 4326 }],
      x: 'Latitud', y: 'Longitud', geographical: true,
      mask: '99° 99\' 99,9999"', code: 'dms'
    },
    {
      name: 'Grados y Minutos Decimales ( ej. 04° 35,772025\' )',
      value: [{ label: 'MAGNA-SIRGAS (WGS84)', value: 4326 }],
      x: 'Latitud', y: 'Longitud', geographical: true,
      mask: '99° 99,999999\'', code: 'ddm'
    },
    {
      name: 'Grados decimales ( ej. 4,59620041° )',
      value: [{ label: 'MAGNA-SIRGAS (WGS84)', value: 4326 }],
      x: 'Latitud', y: 'Longitud', geographical: true,
      mask: '99,99?999999°', code: 'dd'
    },
    {
      name: 'Metros ( ej. 1.106.427 )',
      value: [
        { label: 'MAGNA-SIRGAS Origen Central', value: 3116 },
        { label: 'MAGNA-SIRGAS Origen Este Central', value: 3117 },
        { label: 'MAGNA-SIRGAS Origen Este Este', value: 3118 },
        { label: 'MAGNA-SIRGAS Origen Oeste', value: 3115 },
        { label: 'MAGNA-SIRGAS Origen Oeste Oeste', value: 3114 },
      ],
      x: 'X', y: 'Y', geographical: false, mask: '?9.999.999,9999',
      code: 'm'
    }
  ];
  coordinateUnits = this.optionsCoordinateUnits[0];
  optionsCoordinateSystem = this.coordinateUnits.value;
  coordinateSystem = this.optionsCoordinateSystem[0].value;
  lathem = 'N';
  lonhem = 'O';
  coordinateX: string;
  coordinateY: string;
  featuresSelected: Array<any> = [];
  layerList: any;
  optionsLayers: SelectItem[] = [];
  optionsDepartment: SelectItem[] = [];
  sketchExtract;
  sketchBuffer;
  sketchSelection;
  advancedSearchShape: boolean = false;
  selectedPolygon: SelectItem;
  shapeAttr: boolean = false;
  selectedSketch: any;
  intervalChange: any;
  levelColors = 0;
  indexColor = 0;
  items: MenuItem[];
  selectedBuffer: SelectItem = {
    value: 9036
  };
  selectedLayers: Array<string> = [];
  clearGraphic = false;
  visibleMenu = true;
  contractMenu = true;
  importCsv = new ImportCSV();
  bufDistance: string;
  magnaSirgas = {
    x: null,
    y: null
  };
  magnaSirgasFlag = false;
  sectionSelected: string;
  modesBuffer: SelectItem[] = [
    { value: 'point', title: 'Punto', icon: 'esri-icon-radio-checked' },
    { value: 'line', title: 'Línea', icon: 'esri-icon-minus' },
    { value: 'polyline', title: 'Polilínea', icon: 'esri-icon-polyline' },
    { value: 'rectangle', title: 'Rectángulo', icon: 'esri-icon-sketch-rectangle' },
    { value: 'polygon', title: 'Polígono Libre', icon: 'esri-icon-polygon' }
  ];
  selectedMeasurement: any;
  modesMeasurement: SelectItem[] = [
    { value: 'area', title: 'Área', icon: 'esri-icon-measure-area' },
    { value: 'distance', title: 'Distancia', icon: 'esri-icon-measure-line' },
    { value: 'coordinate', title: 'Ubicación', icon: 'esri-icon-map-pin' }
  ];
  colorsFirst: Array<any> = [];
  colorsSeconds: Array<any> = [];
  colorsThirst: Array<any> = [];
  colorsFourth: Array<any> = [];
  colorsFiveth: Array<any> = [];
  flagSketch = false;
  coordsModel = 'G';
  filter: Array<string> = [];
  objectFilter: Array<any> = [];
  filterS: Array<string> = [];
  quantityFields = 0;
  values: Array<any> = [];
  logicalOperators: Array<any> = [];
  arrQuantity = Array;
  copyrightSGC: Array<string> = [];
  copyrightIGAC: Array<string> = [];
  styleClassAttrTable: string;
  ccViewModel: any;
  hideSearch: boolean = false;
  currentLayerExist = false;
  lyTierrasCreate: any = undefined;
  headerExtract = '';

  constructor(private dialogService: DialogService, private service: MapViewerService,
    private messageService: MessageService, private router: Router, private ref: ChangeDetectorRef, private confirmationService: ConfirmationService) {
    this.setCurrentPosition();
    this.colorsFirst = this.generateColor('#F8C933', '#FFE933', 50);
    this.colorsSeconds = this.generateColor('#E18230', '#F8C933', 50);
    this.colorsThirst = this.generateColor('#D75C31', '#E18230', 50);
    this.colorsFourth = this.generateColor('#CC3D36', '#D75C31', 50);
    this.colorsFiveth = this.generateColor('#44546A', '#FFE933', 50);
    const _this = this;
    this.changeColor(this.indexColor, this.colorsFirst);
    this.indexColor++;
    this.intervalChange = setInterval(() => {
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
        label: 'Cargar capas',
        icon: 'esri-icon-upload',
        items: [
          {
            label: 'Shapefile',
            icon: 'icofont-file-zip',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
            icon: 'icofont-file-excel',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
                    this.importCsv.uploadFileCsv(res.form.elements[0].files, res.data, this.urlGeometryService, this.map, this.view, this);
                  }
                });
              }
            }
          },
          {
            label: 'Archivo GPX',
            icon: 'icofont-file-psd',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
            icon: 'icofont-file-psd',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
            icon: 'icofont-web',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
            icon: 'icofont-web',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
            icon: 'icofont-web',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
            icon: 'icofont-web',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, false, false);
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
        label: 'Extraer información',
        icon: 'icofont-download-alt',
        items: [
          {
            label: 'Descargar Capa',
            icon: 'esri-icon-download',
            command: () => {
              this.openExtract();
            }
          },
          {
            label: 'Extraer Área',
            icon: 'esri-icon-maps',
            command: () => {
              if (!this.errorArcgisService) {
                this.headerExtract = 'Extraer área';
                this.buildOptionsLayers();
                this.layerExtract = false;
                this.visibleModal(false, false, false, true, false, false, false, false, false, false);
                this.view.popup.autoOpenEnabled = false;
              }
            }
          }
        ]
      },
      {
        label: 'Herramientas',
        icon: 'icofont-tools-alt-2',
        items: [
          {
            label: 'Zona de Influencia (Buffer)',
            icon: 'fas fa-bullseye',
            command: () => {
              if (!this.errorArcgisService) {
                this.buildOptionsLayers();
                this.visibleModal(false, false, true, false, false, false, false, false, false, false);
                this.view.popup.autoOpenEnabled = false;
              }
            }
          },
          {
            label: 'Herramientas de Medición',
            icon: 'icofont-ruler-compass',
            command: () => {
              if (!this.errorArcgisService) {
                this.openMeasuringTools();
              }
            }
          },
          {
            label: 'Análisis de Departamento',
            icon: 'fas fa-clone',
            command: () => {
              !this.errorArcgisService ? this.analisis() : null;
            }
          },
          {
            label: 'Cambiar Simbología',
            icon: 'icofont-paint',
            command: () => {
              this.layerSelected = null;
              this.layerSelectedSelection = null;
              !this.errorArcgisService ? this.symbologyChange() : null;
            }
          },
          {
            label: 'Ubicar coordenada',
            icon: 'esri-icon-locate',
            command: () => {
              if (!this.errorArcgisService) {
                this.visibleModal(false, false, false, false, false, false, false, false, true, false);
              }
            }
          }
        ]
      },
      {
        label: 'Impresión',
        icon: 'icofont-printer',
        items: [
          {
            label: 'Impresión rápida',
            icon: 'icofont-print',
            command: () => {
              if (!this.errorArcgisService) {
                (window as any).ga('send', 'event', 'BUTTON', 'click', 'print');
                window.print();
              }
            }
          },
          {
            label: 'Exportar mapa',
            icon: 'fa fa-file-export',
            command: () => {
              this.expandPrint.expand();
            }
          }
        ]
      },
      {
        icon: 'esri-icon-collapse',
        title: 'Expandir/Contraer',
        command: () => {
          if (this.view.width > 446) {
            this.retractMenu();
          } else {
            this.messageService.add({ detail: 'Función no disponible en este modo', summary: 'Información', severity: 'info' });
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
    if (!this.loaded) {
      this.retractMenu();
    }
    if (this.modalTable) {
      const panel = document.getElementsByClassName('ui-dialog-content ui-widget-content');
      if (panel !== undefined && panel[0] !== undefined) {
        const height: number = panel[0].clientHeight;
        if (this.validateHeight(height)) {
          if (panel[0].clientHeight >= 450) {
            this.heightTable = panel[0].clientHeight - 220;
          } else {
            this.heightTable = 450;
          }
          this.ref.detectChanges();
        }
      }
    }
    const paginationPrevious: HTMLCollection = document.getElementsByClassName('esri-popup__pagination-previous');
    const newTextPrevious = 'Ver anterior capa';
    if (paginationPrevious.length > 0) {
      paginationPrevious.item(0).getAttribute('title') !== newTextPrevious ?
        paginationPrevious.item(0).setAttribute('title', newTextPrevious) : null;
    }

    const paginationNext: HTMLCollection = document.getElementsByClassName('esri-popup__pagination-next');
    const newTextNext = 'Ver siguiente capa';
    if (paginationNext.length > 0) {
      paginationNext.item(0).getAttribute('title') !== newTextNext ? paginationNext.item(0).setAttribute('title', newTextNext) : null;
    }
    this.currentLayer = this.layerList !== undefined && this.layerList.selectedItems.length > 0 &&
      this.layerList.selectedItems.items[0] !== null ? this.layerList.selectedItems.items[0].layer :
      this.lyTierrasCreate !== undefined ? this.lyTierrasCreate : null;
    this.currentLayerExist = this.currentLayer !== null ? true : false;
    this.ref.detectChanges();
  }

  public validateHeight(height: number): boolean {
    return height !== 1249 && height !== 478 && height !== 728 && height !== 704 && height !== 680 && height !== 656 && height !== 632
      && height !== 608 && height !== 584 && height !== 560 && height !== 536 && height !== 512 && height !== 488;
  }
  buildOptionsLayers(): void {
    this.optionsLayers = [];
    this.copyrightIGAC = [];
    this.copyrightSGC = [];
    this.map.layers.items.forEach((layer) => {
      if (layer.title !== null) {
        if (layer.copyright !== null) {
          const label = layer.copyright.includes('SGC') ? layer.title + '*' :
            layer.copyright.includes('IGAC') ? layer.title + '**' : layer.title;
          if (layer.copyright.includes('SGC')) {
            this.copyrightSGC.push(layer.title);
          } else if (layer.copyright.includes('IGAC')) {
            this.copyrightIGAC.push(layer.title);
          }
          this.optionsLayers.push({
            label,
            value: layer.title
          });
        }
      }
    });
    this.optionsLayers = this.optionsLayers.reverse();
  }

  buildOptionsLayersValue(nameLayer: string): void {
    this.layersOptionsList = [];
    this.copyrightSGC = [];
    this.copyrightIGAC = [];
    this.optionsLayers = [];
    this.layerSelectedSelection = null;
    this.map.layers.items.forEach((layer) => {
      if (layer.title !== null) {
        const label = layer.copyright.includes('SGC') ? layer.title + '*' :
          layer.copyright.includes('IGAC') ? layer.title + '**' : layer.title;
        if (layer.copyright.includes('SGC')) {
          this.copyrightSGC.push(layer.title);
        } else if (layer.copyright.includes('IGAC')) {
          this.copyrightIGAC.push(layer.title);
        }
        const sel: SelectItem = {
          label,
          value: layer.title
        };
        if (layer.title === nameLayer) {
          this.layerSelectedSelection = sel.value;
          this.layerSelected = layer;
        }
        this.optionsLayers.push(sel);
      }
    });
    this.optionsLayers = this.optionsLayers.reverse();
  }

  changeLayer(event: any): void {
    this.map.layers.items.forEach((layer) => {
      if (layer.title != null && layer.sourceJSON.name === event) {
        this.layerSelected = layer;
      }
    });
  }

  public openSelectionTool(): void {
    if (!this.errorArcgisService) {
      this.advancedSearchShape = true;
      const nameLayer = this.layerList.selectedItems.items[0] !== undefined ? this.layerList.selectedItems.items[0].title : null;
      this.buildOptionsLayersValue(nameLayer);
      this.visibleModal(false, false, false, false, false, false, false, true, false, false);
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
        GraphicsLayer, Graphic, Legend, ScaleBar, geometryEngine, SpatialReference, ProjectParameters, GeometryService,
        CoordinateVM] =
        await loadModules(['esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer', 'esri/widgets/LayerList', 'esri/widgets/Print',
          'esri/widgets/Search', 'esri/widgets/Expand', 'esri/layers/support/LabelClass', 'esri/widgets/BasemapGallery',
          'esri/widgets/Sketch/SketchViewModel', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/widgets/Legend',
          'esri/widgets/ScaleBar', 'esri/geometry/geometryEngine', 'esri/geometry/SpatialReference',
          'esri/tasks/support/ProjectParameters', 'esri/tasks/GeometryService',
          'esri/widgets/CoordinateConversion/CoordinateConversionViewModel']);

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
        zoom: 5,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      this.ccViewModel = new CoordinateVM();
      document.getElementsByClassName('esri-view-root')[0].classList.add('help-cursor')
      this.addSlider();
      // Carga de capa de pozo
      const lyPozo = new FeatureLayer(this.mapRestUrl + '/1', {
        id: 'Pozo',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        minScale: 1155600,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      const waterWellLabelClass = new LabelClass({
        labelExpressionInfo: { expression: '$feature.well_name' },
        symbol: {
          type: 'text',
          color: 'black',
          haloSize: 1,
          haloColor: 'white',
          font: {
            size: 7.5
          }
        }
      });
      lyPozo.load().then(() => {
        lyPozo.title = lyPozo.sourceJSON.name;
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lyPozo.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templatePozo = {
          title: lyPozo.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyPozo,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lyPozo.sourceJSON.name
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyPozo.popupTemplate = templatePozo;
      });
      lyPozo.labelingInfo = [waterWellLabelClass];
      this.map.add(lyPozo);

      // Carga de capa sismica
      const lySismica = new FeatureLayer(this.mapRestUrl + '/2', {
        id: 'Sismica 2D',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        minScale: 1155600,
        mode: FeatureLayer.MODE_ONDEMAND,
        copyright: 'SGC'
      });
      const sismicaLabelClass = new LabelClass({
        labelExpressionInfo: { expression: '$feature.LINE_NAME' },
        symbol: {
          type: 'text',
          color: 'black',
          haloSize: 1,
          haloColor: 'white',
          font: {
            size: 7.5
          }
        }
      });
      lySismica.load().then(() => {
        lySismica.title = lySismica.sourceJSON.name;
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lySismica.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSismica = {
          title: lySismica.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySismica,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lySismica.sourceJSON.name
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lySismica.popupTemplate = templateSismica;
      });
      lySismica.labelingInfo = [sismicaLabelClass];
      this.map.add(lySismica);
      // Carga de capa sismica 3D
      const lySismica3d = new FeatureLayer(this.mapRestUrl + '/3', {
        id: 'Sismica 3D',
        opacity: 1.0,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        minScale: 1155600,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      const sismica3DLabelClass = new LabelClass({
        labelExpressionInfo: { expression: '$feature.NOMBRE' },
        symbol: {
          type: 'text',
          color: 'black',
          haloSize: 1,
          haloColor: 'white',
          font: {
            size: 7.5
          }
        }
      });
      lySismica3d.load().then(() => {
        lySismica3d.title = lySismica3d.sourceJSON.name;
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lySismica3d.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateSismica3d = {
          title: lySismica3d.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lySismica3d,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lySismica3d.sourceJSON.name
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lySismica3d.popupTemplate = templateSismica3d;
      });
      lySismica3d.labelingInfo = [sismica3DLabelClass];
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
        lyMunicipio.title = lyMunicipio.sourceJSON.name;
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lyMunicipio.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateMunicipio = {
          title: lyMunicipio.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: lyMunicipio,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lyMunicipio.sourceJSON.name
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
      this.departmentLayer = lyDepartamento;
      lyDepartamento.load().then(() => {
        lyDepartamento.title = lyDepartamento.sourceJSON.name;
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
          name: lyDepartamento.sourceJSON.name,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        const templateDepartamento = {
          title: lyDepartamento.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        lyDepartamento.popupTemplate = templateDepartamento;
      });
      this.map.add(lyDepartamento);

      const statesLabelClass = new LabelClass({
        labelExpressionInfo: { expression: '$feature.CONTRATO_N' },
        symbol: {
          type: 'text',
          color: 'black',
          haloSize: 1,
          haloColor: 'white',
          font: {
            size: 7.5
          }
        }
      });
      // Carga de capa de sensibilidad
      // const lySensibilidad = new FeatureLayer(this.mapRestUrl + '/7', {
      //   labelExpressionInfo: { expression: '$feature.CONTRATO_N' },
      //   id: 'Sensibilidad',
      //   opacity: 0.5,
      //   visible: false,
      //   outFields: ['*'],
      //   showAttribution: true,
      //   mode: FeatureLayer.MODE_ONDEMAND
      // });
      // lySensibilidad.load().then(() => {
      //   lySensibilidad.title = lySensibilidad.sourceJSON.name;
      //   const searchField: Array<any> = [];
      //   let text = '';
      //   // this.layerSelected = lyTierras;
      //   for (const field of lySensibilidad.fields) {
      //     searchField.push(field.name);
      //     text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
      //   }
      //   const templateSensibilidad = {
      //     title: lySensibilidad.sourceJSON.name,
      //     content: text,
      //     fieldInfos: []
      //   };
      //   const sourceSearch: Array<any> = this.sourceSearch.slice();
      //   sourceSearch.push({
      //     layer: lySensibilidad,
      //     searchFields: searchField,
      //     exactMatch: false,
      //     outFields: ['*'],
      //     name: lySensibilidad.sourceJSON.name,
      //     suggestionsEnabled: true,
      //   });
      //   this.sourceSearch = null;
      //   this.sourceSearch = sourceSearch;
      //   this.search.sources = this.sourceSearch;
      //   lySensibilidad.popupTemplate = templateSensibilidad;
      // });
      // lySensibilidad.labelingInfo = [statesLabelClass];
      // this.map.add(lySensibilidad);

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
        lyRezumadero.title = lyRezumadero.sourceJSON.name;
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lyRezumadero.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateRezumadero = {
          title: lyRezumadero.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.unshift({
          layer: lyRezumadero,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lyRezumadero.sourceJSON.name
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyRezumadero.popupTemplate = templateRezumadero;
      });
      this.map.add(lyRezumadero);

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
        lyCuencas.title = lyCuencas.sourceJSON.name;
        let text = '';
        const searchField: Array<any> = [];
        for (const field of lyCuencas.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateCuencas = {
          title: lyCuencas.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.unshift({
          layer: lyCuencas,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lyCuencas.sourceJSON.name,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyCuencas.popupTemplate = templateCuencas;
      });
      this.map.add(lyCuencas);

      // Carga de capa de tierras
      // const lyTierras = new FeatureLayer(this.mapRestUrl + '/8', {
      const lyTierras = new FeatureLayer(this.mapRestUrl + '/7', {
        id: 'Tierras',
        opacity: 0.5,
        visible: true,
        outFields: ['*'],
        showAttribution: true,
        displayField: 'CONTRATO_N',
        mode: FeatureLayer.MODE_ONDEMAND
      });
      lyTierras.load().then(() => {
        lyTierras.title = lyTierras.sourceJSON.name;
        const searchField: Array<any> = [];
        let text = '';
        for (const field of lyTierras.fields) {
          field.type === 'string' || field.type === 'double' ? searchField.push(field.name) : null;
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        const templateTierras = {
          title: lyTierras.sourceJSON.name,
          content: text,
          fieldInfos: []
        };
        const sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.unshift({
          layer: lyTierras,
          searchFields: searchField,
          exactMatch: false,
          outFields: ['*'],
          name: lyTierras.sourceJSON.name,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        lyTierras.popupTemplate = templateTierras;
      });
      lyTierras.labelingInfo = [statesLabelClass];
      this.map.add(lyTierras);
      this.lyTierrasCreate = lyTierras;
      this.view.on('click', (e) => {
        if (this.activeWidget !== undefined && this.activeWidget !== null && this.activeWidget.viewModel.mode !== undefined) {
          if (this.activeWidget.viewModel.mode === 'capture') {
            const outSR = new SpatialReference({ wkid: 3116 }); // MAGNA-SIRGAS / Colombia Bogota zone
            const params = new ProjectParameters();
            params.geometries = [e.mapPoint];
            params.outSR = outSR;
            geomSvc.project(params).then((response) => {
              this.magnaSirgas.x = this.formatNumber(response[0].x, 4);
              this.magnaSirgas.y = this.formatNumber(response[0].y, 4);
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
        if (e.error.message !== 'Aborted') {
          this.messageService.add({ detail: `Error cargando la capa ${e.layer.id}`, summary: 'Carga de capas', severity: 'error' });
        }
      });
      this.view.watch('stationary', (isStationary) => {
        this.showCoordinates(this.view.center);
      });
      this.view.on('pointer-move', (evt) => {
        this.showCoordinates(this.view.toMap({ x: evt.x, y: evt.y }));
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
                title: 'Análisis de Departamento',
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
          this.buildOptionsLayersValue(layer.title);
          if (event.action.id === 'attr-table') {
            this.objectFilter = [];
            this.values = [];
            this.logicalOperators = [];
            this.quantityFields = 0;
            (window as any).ga('send', 'event', 'BUTTON', 'click', 'att-table-button');
            layerListExpand.collapse();
            this.getFeaturesLayer(layer);
          } else if (event.action.id === 'analisis') {
            this.departmentLayer = layer;
            layerListExpand.collapse();
            this.analisis();
          } else if (event.action.id === 'simbologia') {
            layerListExpand.collapse();
            this.layerSelected = layer;
            this.symbologyChange();
          } else if (event.action.id === 'increase-opacity') {
            layer.opacity += 0.25;
          } else if (event.action.id === 'decrease-opacity') {
            layer.opacity -= 0.25;
          } else if (event.action.id === 'seleccion') {
            this.featureDptos = [];
            this.visibleModal(false, false, false, false, false, false, false, true, false, false);
            this.layerSelected = layer;
            layerListExpand.collapse();
          }
        });
      });

      this.layerList = layerList;
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
        includeDefaultSources: false,
        maxSuggestions: 100000000000
      });

      this.view.ui.add(this.search, {
        position: 'top-right'
      });

      this.view.ui.move(['zoom'], 'top-right');

      const print = new Print({
        view: this.view,
        printServiceUrl: this.printUrl,
        templateOptions: {
          copyright: 'Propiedad de la ANH. Derechos Reservados Copyright © ANH 2020',
          author: 'Prohibida la reproducción con fines comerciales'
        }
      });
      this.expandPrint = new Expand({
        expandIconClass: 'fa fa-file-export',
        expandTooltip: 'Exportar mapa',
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
      this.sketchExtract = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });
      this.sketchExtract.on('create', (event) => {
        this.flagSketch = true;
        if (event.state === 'complete') {
          this.flagSketch = false;
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
          if (this.selectedPolygon.value !== 'entity') {
            const graphic = new Graphic({
              geometry: event.graphic.geometry,
              symbol: symbolF
            });
            this.view.graphics.add(graphic);
            this.clearGraphic = true;
          } else {
            if (this.selectedLayers.length === 0) {
              this.messageService.add({
                severity: 'warn',
                summary: '',
                detail: 'Debe seleccionar una capa.'
              });
            }
            this.selectedLayers.forEach(layer => {
              this.changeLayer(layer);
              const spQry = this.layerSelected.createQuery();
              spQry.maxAllowableOffset = 1;
              spQry.geometry = event.graphic.geometry;
              this.layerSelected.queryFeatures(spQry).then((result) => {
                result.features.forEach(key => {
                  const graphic = new Graphic({
                    geometry: key.geometry,
                    symbol: symbolF
                  });
                  const graphicCreated = this.view.graphics.find((x) => {
                    return JSON.stringify(x.geometry) === JSON.stringify(graphic.geometry);
                  });
                  graphicCreated === undefined ? this.view.graphics.add(graphic) : this.view.graphics.remove(graphicCreated);
                  this.clearGraphic = true;
                });
              });
            });
          }
          this.onChangeSelect();
        }
      });
      const sketchVMBuffer = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });
      sketchVMBuffer.on('create', (event) => {
        this.flagSketch = true;
        if (event.state === 'complete') {
          this.flagSketch = false;
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
          if (this.bufDistance !== undefined) {
            const buffer = geometryEngine.geodesicBuffer(geometry, this.bufDistance, this.selectedBuffer.value);
            this.view.graphics.add(
              new Graphic({
                geometry: buffer,
                symbol: symbolBuffer
              })
            );
          }
          this.view.graphics.add(graphic);
          this.view.goTo(this.view.graphics);
        }
      });

      this.sketchSelection = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });

      this.sketchSelection.on('create', (event) => {
        this.flagSketch = true;
        if (event.state === 'complete') {
          if (this.layerSelectedSelection !== null) {
            this.flagSketch = false;
            this.makingWork = true;
            const spQry = this.layerSelected.createQuery();
            spQry.maxAllowableOffset = 1;
            spQry.geometry = event.graphic.geometry;
            this.layerSelected.queryFeatures(spQry).then((result) => {
              if (result.features.length === 0) {
                this.makingWork = false;
                this.messageService.add({
                  severity: 'info',
                  summary: '',
                  detail: `No se seleccionaron elementos de la capa ${this.layerSelected.id}`
                });
              } else {
                this.messageService.add({
                  severity: 'info',
                  summary: '',
                  detail: `Se seleccionaron ${result.features.length} elementos de la capa ${this.layerSelected.id}
                  y se cargaron sus atributos.`
                });
                this.columnsTable = result.fields;
                this.clearGraphics();
                this.featureDptos = result.features;
                this.layerAttrTable = this.layerSelected;
                layerListExpand.collapse();
                loadModules(['esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Color', 'dojo/_base/array',
                  'esri/Graphic']).then(([SimpleFillSymbol, SimpleLineSymbol, Color, dojo, Graphic]) => {
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
                    this.styleClassAttrTable = 'maxTable';
                    this.visibleModal(false, false, false, false, false, false, true, true, false, false);
                  });
              }
            }, err => {
              console.error(err);
              this.makingWork = false;
              this.messageService.add({
                severity: 'error',
                summary: '',
                detail: err.message
              });
            });
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: '',
              detail: 'Debe seleccionar una capa.'
            });
          }
          this.onChangeSelectedSketchSelection();
        }
      });
      this.sketchBuffer = sketchVMBuffer;
      const scaleBar = new ScaleBar({
        style: 'line',
        view: this.view,
        unit: 'dual'
      });
      this.view.ui.add(scaleBar, {
        position: 'bottom-left',
      });
      const help = new Expand({
        expandIconClass: 'esri-icon-question',
        view: this.view,
        content: document.getElementById('help'),
        group: 'expand',
        expandTooltip: 'Ayuda'
      });
      this.view.ui.add(['coordsWidget', 'time-slider'], 'bottom-right');
      this.view.ui.add([this.expandPrint, expandBaseMapGallery, expandLegend, layerListExpand, help], 'top-right');
      return this.view;
    } catch (error) {
      console.error('EsriLoader: ', error);
    }
  }

  public showCoordinates(pt): void {
    this.coordsWidget = document.getElementById('coords');
    let coords = '';
    if (this.coordsModel === 'G') {
      const format = this.ccViewModel.formats.find((frmt) => {
        return frmt.name === 'dms';
      });
      this.ccViewModel.convert(format, pt).then((success) => {
        const s = success.coordinate.split(' ');
        const lat = s[0] + '° ' + s[1] + '\' ' + this.formatNumber(parseFloat(s[2]), 3) + '"' + s[2].charAt(s[2].length - 1);
        s[3] = s[3].charAt(0) !== '0' ? s[3] : s[3].substr(1);
        const long = s[3] + '° ' + s[4] + '\' ' + this.formatNumber(parseFloat(s[5]), 3) + '"'
          + s[5].charAt(s[2].length - 1);
        coords = lat + ', ' + long;
        coords = coords.replace('W', 'O');
        this.coordsWidget.innerHTML = coords;
      }, error => {
        console.log(error);
      });
    } else {
      loadModules(['esri/tasks/GeometryService', 'esri/geometry/SpatialReference', 'esri/tasks/support/ProjectParameters'])
        .then(([GeometryService, SpatialReference, ProjectParameters]) => {
          const geomSvc = new GeometryService(this.urlGeometryService);
          const outSR = new SpatialReference({ wkid: 3116 });
          const params = new ProjectParameters({
            geometries: [pt],
            outSpatialReference: outSR
          });
          geomSvc.project(params).then((response) => {
            const pto = response[0];
            coords = 'N ' + this.formatNumber(pto.y, 4) + ', E ' + this.formatNumber(pto.x, 4);
            this.coordsWidget.innerHTML = coords;
          });
        });
    }
  }

  public formatNumber(n, min) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: min, maximumFractionDigits: min });
  }

  public symbologyChange(): void {
    const title = this.layerSelected != null && this.layerSelected !== undefined ? this.layerSelected.title :
      this.layerList.selectedItems.items[0] !== undefined ? this.layerList.selectedItems.items[0].title : '';
    this.buildOptionsLayersValue(title);
    const dialog = this.dialogService.open(DialogSymbologyChangeComponent, {
      width: '400px',
      header: `Cambio de Simbología ${title}`,
      baseZIndex: 20,
      data: { help: this, optionsLayers: this.optionsLayers, layerSelected: this.layerSelectedSelection }
    });
    dialog.onClose.subscribe(res => {
      if (res !== undefined) {
        this.map.layers.items.forEach((layer) => {
          if (layer.title !== null) {
            if (layer.sourceJSON.name === res.layerSelected) {
              this.layerSelected = layer;
            }
          }
        });
        (window as any).ga('send', 'event', 'BUTTON', 'click', 'symbol-start');
        this.makingWork = true;
        loadModules(['esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleFillSymbol',
          'esri/symbols/SimpleLineSymbol', 'esri/Color', 'esri/renderers/SimpleRenderer']).then(([
            SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Color, SimpleRenderer]) => {
            let defaultSymbol: any;
            switch (this.layerSelected.geometryType) {
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
            this.layerSelected.renderer = renderer;
          });
        this.makingWork = false;
      }
    });
  }
  public analisis(): void {
    const query = {
      outFields: ['*'],
      returnGeometry: true,
      where: ''
    };
    this.departmentLayer.queryFeatures(query).then((result) => {
      const dptos: Array<any> = [];
      for (const r of result.features) {
        const dpto = {
          attributes: Object.assign({}, r.attributes),
        };
        dptos.push(dpto);
      }
      this.selectDpto = dptos;
      this.featureDptos = result.features;
      this.columnsTable = result.fields;
      this.dptosSelected = [];
      this.layerSelected = this.departmentLayer;
      this.visibleModal(false, true, false, false, false, false, false, false, false, false);
    }, (err) => {
      console.error(err);
    });
  }

  /**
   * Limpia los graficos de la vista
   */
  clearGraphics() {
    this.view.graphics.removeAll();
    this.clearGraphic = false;
    if (this.modalSelection) {
      this.advancedSearchShape = true;
      this.featureDptos = []
    }
  }

  ngOnInit() {
    this.service.validateServices(this.mapRestUrl).subscribe(success => {
      // console.log(success);
    }, error => {
      this.errorArcgisService = true;
      console.error(error);
    });
    this.initializeMap();
  }

  public closeDialogAttr(): void {
    if (this.values.length > 0) {
      this.confirmationService.confirm({
        message: 'Al cerrar la tabla de atributos perderá todos los datos filtrados. ¿Está seguro de cerrar la tabla de atributos?',
        acceptLabel: 'Si',
        rejectLabel: 'No',
        accept: () => {
          this.modalTable = false;
          this.onHideDialogAnalisis();
        }
      })
    } else {
      this.modalTable = false;
      this.onHideDialogAnalisis();
    }
  }

  public changeColor(indexColor: number, colors: Array<any>): void {
    const elements = document.getElementsByClassName('ui-progressbar');
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index] as HTMLElement;
      element.style.background = `#${colors[indexColor]}`;
    }
  }

  public hex(c: any): string {
    const s = '0123456789abcdef';
    let i = parseInt(c);
    if (i === 0 || isNaN(c)) {
      return '00';
    }
    i = Math.round(Math.min(Math.max(0, i), 255));
    return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
  }

  public convertToHex(rgb: any): string {
    return this.hex(rgb[0]) + this.hex(rgb[1]) + this.hex(rgb[2]);
  }

  public trim(s): string {
    return (s.charAt(0) === '#') ? s.substring(1, 7) : s;
  }

  public convertToRGB(hex): Array<any> {
    const color = [];
    color[0] = parseInt((this.trim(hex)).substring(0, 2), 16);
    color[1] = parseInt((this.trim(hex)).substring(2, 4), 16);
    color[2] = parseInt((this.trim(hex)).substring(4, 6), 16);
    return color;
  }

  public generateColor(colorStart, colorEnd, colorCount): Array<any> {
    const start = this.convertToRGB(colorStart);
    const end = this.convertToRGB(colorEnd);
    const len = colorCount;
    let alpha = 0.0;
    const salida = [];
    for (let i = 0; i < len; i++) {
      const c = [];
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
    this.selectedMeasurement = '';
    this.setActiveWidget();
    this.view.popup.autoOpenEnabled = true;
    this.flagSketch = false;
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
            container: document.getElementById('divWidget'),
          });
          this.activeWidget.viewModel.newMeasurement();
          break;
        case 'area':
          this.activeWidget = new AreaMeasurement2D({
            view: this.view,
            container: document.getElementById('divWidget'),
            unit: 'hectares'
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
          const formatXY = this.activeWidget.formats.find((f) => {
            return f.name === 'xy';
          });
          this.activeWidget.formats.remove(formatXY);
          formatXY.name = 'grados';
          const xy = formatXY.currentPattern.split(',');
          formatXY.currentPattern = xy[1] + ', ' + xy[0];
          this.activeWidget.formats.push(formatXY);
          const formatBasemap = this.activeWidget.formats.find((f) => {
            return f.name === 'basemap';
          });
          this.activeWidget.formats.remove(formatBasemap);
          const basemap = formatBasemap.defaultPattern.split(',');
          formatBasemap.currentPattern = basemap[1] + ', ' + basemap[0];
          this.activeWidget.formats.push(formatBasemap);

          this.activeWidget.viewModel.locationSymbol = symbol;
          const ul = document.getElementsByClassName('esri-coordinate-conversion__tools')[0] as HTMLElement;
          ul.getElementsByTagName('li')[0].click();
          this.sleep(500).then(() => {
            const rowTools = document.getElementsByClassName('esri-coordinate-conversion__row')[1] as HTMLElement;
            const tools = rowTools.getElementsByClassName('esri-coordinate-conversion__tools')[0] as HTMLElement;
            tools.getElementsByTagName('li')[0].addEventListener('click', (e: Event) => this.visibleModal(false, false, false, false, false, false, false, false, true, false));
          })
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      responseType: 'json',
      timeout: 0
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
    const [FeatureLayer, Graphic, Field, SimpleRenderer] =
      await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/layers/support/Field', 'esri/renderers/SimpleRenderer']);
    let sourceGraphics = [];
    const layers = featureCollection.data.featureCollection.layers.map((layer) => {
      console.log(layer);
      const layerName = layer.layerDefinition.name;
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
        lyTierrasMdt = this.map.layers.items.find(x => x.id === 'Tierras_MDT');
        if (lyTierrasMdt !== undefined) {
          this.map.remove(lyTierrasMdt);
          console.log('Borró');
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
            lyTierrasMdt.title = lyTierrasMdt.sourceJSON.name;
            let text = '';
            for (const field of lyTierrasMdt.fields) {
              text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
            }
            const templateTierras = {
              title: lyTierrasMdt.sourceJSON.name,
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
            const query = {
              outFields: ['*'],
              returnGeometry: false,
              where: ''
            };
            let labelExpression;
            lyTierrasMdt.queryFeatures(query).then((result) => {
              const fields = result.fields;
              if (fields.find(x => x.name === 'CONTRAT_N')) {
                labelExpression = '$feature.CONTRAT_N';
              } else if (fields.find(x => x.name === 'CONTRATO_N')) {
                labelExpression = '$feature.CONTRATO_N';
              }
              console.log(lyTierrasMdt.displayField);
              const statesLabelClass = new LabelClass({
                labelExpressionInfo: { expression: labelExpression },
                symbol: {
                  type: 'text',
                  color: 'black',
                  haloSize: 1,
                  haloColor: 'white',
                  font: {
                    size: 7.5
                  }
                }
              });
              lyTierrasMdt.labelingInfo = [statesLabelClass];
              this.map.add(lyTierrasMdt);
              (window as any).ga('send', 'event', 'TOOL', 'slide', 'ts-tierras');
            }, error => {
              this.map.add(lyTierrasMdt);
              (window as any).ga('send', 'event', 'TOOL', 'slide', 'ts-tierras');
            });
          });
          console.log('Afuera');
        } else {
          layerTierras.visible = true;
        }
      });
    }, error => {
      console.error(error);
    });
  }

  getFeaturesLayer(layer: any): void {
    this.styleClassAttrTable = 'maxTable';
    this.minimizeMaximize = true;
    const query = {
      outFields: ['*'],
      returnGeometry: true,
      where: ''
    };
    layer.queryFeatures(query).then((result) => {
      this.featureDptos = result.features;
      this.columnsTable = result.fields[0] !== undefined ? result.fields : layer.fields;
      for (let index = 0; index < this.columnsTable.length; index++) {
        this.filter[index] = 'contains';
      }
      this.layerAttrTable = null;
      this.layerAttrTable = layer;
      this.makingWork = false;
      this.visibleModal(false, false, false, false, false, false, true, false, false, false);
    }, (err) => {
      console.error(err);
    });
  }

  hideAdvancedSearch(event) {
    if (this.objectFilter.length === 0 && this.values.length === 0 && this.logicalOperators.length === 0) {
      this.hideSearch = true;
      this.getFeaturesLayerSelected();
      this.hideSearch = false;
      this.modalFilter = false;
    }
  }

  getFeaturesLayerSelected(): void {
    if (this.hideSearch) {
      this.advancedSearchShape = false;
      this.objectFilter = [];
      this.filterS = [];
      this.values = [];
      this.quantityFields = 0;
      const query = {
        outFields: ['*'],
        returnGeometry: false,
        where: ''
      };
      this.layerAttrTable.queryFeatures(query).then((result) => {
        this.featureDptos = result.features;
        // this.columnsTable = Object.keys(this.featureDptos[0].attributes);
        result.fields !== undefined && result.fields !== null && result.fields[0] !== undefined ? this.columnsTable = result.fields : null;
        for (let index = 0; index < this.columnsTable.length; index++) {
          this.filter[index] = 'contains';
        }
        this.visibleModal(false, false, false, false, false, false, true, false, false, false);
      }, (err) => {
        console.error(err);
      });
    }
  }

  public getTypeObject(name: string): string {
    let type: string;
    for (const col of this.columnsTable) {
      if (col.name === name) {
        type = col.type;
        break;
      }
    }
    return type;
  }
  public getFilterParams(): void {
    let params = '';
    for (let index = 0; index < this.objectFilter.length; index++) {
      if (this.filterS[index] !== undefined && this.filterS[index] !== '' && this.values[index] !== undefined && this.values[index] !== '') {
        if (index > 0) {
          params = `${params} ${this.logicalOperators[index - 1]}`;
        }
        switch (this.filterS[index]) {
          case 'contains':
            params = `${params} UPPER(${this.objectFilter[index]}) LIKE '%${this.values[index].toUpperCase()}%'`;
            break;
          case 'startsWith':
            params = `${params} UPPER(${this.objectFilter[index]}) LIKE '${this.values[index].toUpperCase()}%'`;
            break;
          case 'endsWith':
            params = `${params} UPPER(${this.objectFilter[index]}) LIKE '%${this.values[index].toUpperCase()}'`;
            break;
          case 'equals':
            if (this.getTypeObject(this.objectFilter[index]) === 'string') {
              params = `${params} ${this.objectFilter[index]} = '${this.values[index].toUpperCase()}'`;
            } else {
              params = `${params} ${this.objectFilter[index]} = ${this.values[index]}`;
            }
            break;
          case 'notEquals':
            if (this.getTypeObject(this.objectFilter[index]) === 'string') {
              params = `${params} NOT ${this.objectFilter[index]} = '${this.values[index]}'`;
            } else {
              params = `${params} NOT ${this.objectFilter[index]} = ${this.values[index]}`;
            }
            break;
          case 'lt':
            params = `${params} ${this.objectFilter[index]} < ${this.values[index]}`;
            break;
          case 'lte':
            params = `${params} ${this.objectFilter[index]} <= ${this.values[index]}`;
            break;
          case 'gt':
            params = `${params} ${this.objectFilter[index]} > ${this.values[index]}`;
            break;
          case 'gte':
            params = `${params} ${this.objectFilter[index]} >= ${this.values[index]}`;
            break;
          default:
            break;
        }
      }
    }
    const query = {
      outFields: ['*'],
      returnGeometry: true,
      where: params
    };
    this.layerAttrTable.queryFeatures(query).then((result) => {
      this.featureDptos = result.features;
      // this.columnsTable = Object.keys(this.featureDptos[0].attributes);
      //this.columnsTable = result.fields;
    }, (err) => {
      console.error(err);
    });
  }

  /**
   * Método que se ejecuta cuando se cambia la selección de poligono en el sketch
   */
  onChangeSelect() {
    if (this.selectedPolygon.value === 'free-pol') {
      this.sketchExtract.create('polygon', { mode: 'freehand' });
    } else if (this.selectedPolygon.value === 'entity') {
      this.sketchExtract.create('point');
    } else {
      this.sketchExtract.create(this.selectedPolygon.value);
    }
  }

  /**
   * Método encargado de la funcionalidad de extraer datos a un archivo Shapefile
   */
  async extractShape() {
    const [FeatureSet, Geoprocessor, Polygon, GraphicsLayer, dojo, Graphic] = await loadModules(['esri/tasks/support/FeatureSet',
      'esri/tasks/Geoprocessor', 'esri/geometry/Polygon', 'esri/layers/GraphicsLayer', 'dojo/_base/array', 'esri/Graphic']);
    const gpExtract = new Geoprocessor({
      url: this.urlExtractShape,
      outSpatialReference: {
        wkid: 4326
      }
    });
    if (!this.layerExtract && (this.selectedLayers.length === 0 || this.view.graphics.length === 0) && !this.shapeAttr && !this.advancedSearchShape) {
      if (this.selectedLayers.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: '',
          detail: 'Debe seleccionar las capas que desea extraer.'
        });
      }
      if (this.selectedPolygon === undefined && !this.layerExtract) {
        this.messageService.add({
          severity: 'warn',
          summary: '',
          detail: 'Debe seleccionar elementos de la capa actual para poder extraer datos.'
        });
      }
      if (this.view.graphics.length === 0 && !this.layerExtract) {
        this.messageService.add({
          severity: 'warn',
          summary: '',
          detail: 'Debe dibujar el área de interes para poder extraer datos.'
        });
      }
    } else if (this.layerExtract && this.selectedLayers.length === 0 && !this.shapeAttr) {
      this.messageService.add({
        severity: 'warn',
        summary: '',
        detail: 'Debe seleccionar las capas que desea extraer.'
      });
    } else {
      this.makingWork = true;
      if (this.layerExtract) {
        this.sourceLayer.push({
          geometry: new Polygon({
            spatialReference: {
              wkid: 102100
            },
            rings: [
              [
                [-9618186.050867643, 1884309.6297609266],
                [-7622262.368285651, 1982149.0259659262],
                [-7250472.662706653, -498079.6678308132],
                [-9412723.318837143, -566567.245174313],
                [-9618186.050867643, 1884309.6297609266]
              ]
            ]
          }),
          symbol: {
            type: 'simple-fill',
            color: [255, 255, 0, 64],
            outline: {
              type: 'simple-line',
              color: [255, 0, 0, 255],
              width: 2,
              style: 'dash-dot'
            },
            style: 'solid'
          },
          attributes: {},
          popupTemplate: null
        });
      } else if (this.shapeAttr) {
        for (const filter of this.attrTable.filteredValue) {
          this.sourceLayer.push(
            new Graphic({
              geometry: filter.geometry,
              symbol: {
                type: 'simple-line',  // autocasts as new SimpleLineSymbol()
                color: 'red',
                width: '2px',
              }
            })
          );
        }
      } else if (this.advancedSearchShape) {
        for (const value of this.featureDptos) {
          this.sourceLayer.push(
            new Graphic({
              geometry: value.geometry,
              symbol: {
                type: 'simple-line',  // autocasts as new SimpleLineSymbol()
                color: 'red',
                width: '2px',
              }
            })
          )
        }
      }
      const features = this.layerExtract || this.shapeAttr || this.advancedSearchShape ? this.sourceLayer : this.view.graphics.items;
      console.log(features)
      const featureSet = new FeatureSet();
      featureSet.features = features;
      const params = {
        Layers_to_Clip: this.selectedLayers,
        Area_of_Interest: featureSet,
        Feature_Format: 'Shapefile - SHP - .shp'
      };
      gpExtract.submitJob(params).then((jobInfo) => {
        const options = {
          statusCallback: () => { }
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
          // this.clearGraphics();
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
    this.sourceLayer = [];
    // this.layerExtract = false;
    this.shapeAttr = false;
    this.advancedSearchShape = false;
  }

  /**
   * Método que se ejecuta cuando un item de la tabla de atributos es seleccionado
   * @param event -> Evento con el item de la tabla seleccionado
   */
  public onRowSelect(event: any, goTo?: boolean): void {
    console.log(event.data)
    loadModules(['esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
      'esri/Color', 'dojo/_base/array', 'esri/Graphic', 'esri/tasks/GeometryService',
      'esri/geometry/SpatialReference', 'esri/tasks/support/ProjectParameters'])
      .then(([SimpleFillSymbol, SimpleLineSymbol, Color, dojo, Graphic, GeometryService,
        SpatialReference, ProjectParameters]) => {
        const symbolX = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255, 1.0]), 2),
          new Color([0, 0, 0, 0.5]));
        const symbolY = {
          type: 'simple-line',  // autocasts as new SimpleLineSymbol()
          color: 'red',
          width: '2px',
        };
        const symbol = goTo ? symbolY : symbolX;
        const graphic = new Graphic({
          geometry: event.data.geometry,
          symbol
        });
        const objectGraphic = {
          attr: event.data.attributes,
          graphic
        };
        this.graphicGoTo !== undefined ? this.view.graphics.remove(this.graphicGoTo) : null;
        goTo ? this.graphicGoTo = graphic : this.graphics.push(objectGraphic);
        if (goTo) {
          const geomSvc = new GeometryService(this.urlGeometryService);
          const outSR = new SpatialReference({ wkid: 4326 });
          const params = new ProjectParameters({
            geometries: [event.data.geometry],
            outSpatialReference: outSR
          });
          geomSvc.project(params).then((response) => {
            this.view.goTo(response[0]);
          });
        }
        this.view.graphics.add(graphic);
      });
  }

  public onRowSelectGoTo(item: any) {
    const event = { data: item };
    this.onRowSelect(event, true);
  }

  /**
   * Método que se ejecuta cuando el dialogo de tabla de atributos es cerrado
   */
  public onHideDialogAtributos(): void {
    this.minimizeMaximize = true;
    this.graphics = [];
    this.clearGraphics();
  }

  /**
   * Retorna el data key de la tabla de atributos
   */
  public dataKey(): string {
    return this.columnsTable !== null && this.columnsTable !== undefined ? `attributes.${this.columnsTable[0].name}` : null;
  }

  public extractShapeFromAttr(): void {
    if (!this.advancedSearchShape && this.featuresSelected.length === 0 && (this.attrTable.filteredValue === undefined || this.attrTable.filteredValue === null || this.attrTable.filteredValue.length === 0)) {
      this.layerExtract = true;
      this.shapeAttr = false;
    } else if (this.featuresSelected.length === 0 && (this.attrTable.filteredValue !== undefined && this.attrTable.filteredValue !== null && this.attrTable.filteredValue.length > 0)) {
      this.layerExtract = false;
      this.shapeAttr = true;
    }
    this.buildOptionsLayers();
    for (const option of this.optionsLayers) {
      if (option.value === this.layerSelected.sourceJSON.name) {
        this.selectedLayers.push(option.value);
        break;
      }
    }
    this.extractShape();
  }

  public nextLayer(): void {
    this.makingWork = true;
    let index = this.map.layers.items.indexOf(this.layerSelected);
    if (index >= this.map.layers.items.length - 1) {
      index = 0;
    } else {
      index++;
    }
    this.layerSelected = this.map.layers.items[index];
    this.featureDptos = null;
    this.columnsTable = null;
    this.getFeaturesLayer(this.layerSelected);
  }

  public previousLayer(): void {
    this.makingWork = true;
    let index = this.map.layers.items.indexOf(this.layerSelected);
    if (index === 0) {
      index = this.map.layers.items.length - 1;
    } else {
      index--;
    }
    this.layerSelected = this.map.layers.items[index];
    this.featureDptos = null;
    this.columnsTable = null;
    this.getFeaturesLayer(this.layerSelected);
  }
  /**
   * Método que se ejecuta cuando un elemento de la tabla de atributos es deseleccionado
   * @param event -> Evento que contiene el dato deseleccionado
   */
  public onRowUnselect(event: any): void {
    for (const object of this.graphics) {
      if (object.attr !== undefined && JSON.stringify(object.attr) === JSON.stringify(event.data.attributes)) {
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
   * Retorna los nombres de los departamentos seleccionados en el análisis de cobertura
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
    this.sketchExtract.cancel();
    this.view.popup.autoOpenEnabled = true;
    this.flagSketch = false;
  }

  changeAttrTable(event: any) {
    const ev = {
      data: {
        attributes: event.itemValue.attributes,
        geometry: null
      }
    };
    if (this.modalAnalysis) {
      for (const r of this.featureDptos) {
        if (r.attributes.DEPARTAMEN === ev.data.attributes.DEPARTAMEN) {
          ev.data.geometry = r.geometry;
          break;
        }
      }
    }
    if (event.value.indexOf(event.itemValue) !== -1) {
      this.onRowSelect(ev);
    } else {
      this.onRowUnselect(ev);
    }
  }

  /**
   * Metodo que se realiza cuando se cierra el dialogo de análisis de cobertura
   */
  onHideDialogAnalisis() {
    // this.featuresSelected = [];
    // this.clearGraphics();
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
    this.flagSketch = false;
  }

  /**
   * Muestra el "acerca de" del Geovisor
   */
  onShowAbout() {
    this.visibleModal(true, false, false, false, false, false, false, false, false, false);
  }

  /**
   * Muestra la guia del Geovisor
   */
  onShowGuide() {
    this.sectionSelected = null;
    this.visibleModal(false, false, false, false, true, false, false, false, false, false);
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
    this.makingWork = true;
    const attribute: Array<any> = [];
    if (this.featuresSelected.length === 0) {
      if (this.attrTable.filteredValue !== undefined && this.attrTable.filteredValue !== null) {
        for (const r of this.attrTable.filteredValue) {
          const object = r.attributes;
          attribute.push(object)
        }
      } else {
        for (const r of this.featureDptos) {
          const object = r.attributes;
          attribute.push(object);
        }
      }
    } else {
      for (const r of this.featuresSelected) {
        const object = r.attributes;
        attribute.push(object);
      }
    }
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(attribute);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBuffer: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(dataBuffer, this.layerSelected.title + EXCEL_EXTENSION);
    this.makingWork = false;
  }

  public cleanFilters(): void {
    this.objectFilter = [];
    this.values = [];
    this.logicalOperators = [];
    this.quantityFields = 0;
    this.getFilterParams();
  }

  /**
   * @param about -> Bandera para dialog About
   * @param analysis -> Bandera para dialog Análisis de cobertura
   * @param buffer -> Bandera para dialog Zona de influencia
   * @param extract -> Bandera para dialog Extraer capa
   * @param guide -> Bandera para dialog Guía
   * @param measurement -> Bandera para dialog Herramientas de medición
   * @param table -> Bandera para dialog Tabla de atributos
   */
  public visibleModal(about: boolean, analysis: boolean, buffer: boolean, extract: boolean, guide: boolean, measurement: boolean,
    table: boolean, selection: boolean, coordinate: boolean, filter: boolean) {
    this.modalAbout = about;
    this.modalAnalysis = analysis;
    this.modalBuffer = buffer;
    this.modalExtract = extract;
    this.modalGuide = guide;
    this.modalMeasurement = measurement;
    this.modalTable = table;
    this.modalSelection = selection;
    this.modalCoordinate = coordinate;
    this.modalFilter = filter;
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
    // this.clearGraphics();
    this.sketchSelection.cancel();
    this.selectedSketch = null;
    this.advancedSearchShape = false;
  }


  public getNameLayer(): string {
    return this.layerSelected !== undefined || this.layerSelected != null ? this.layerSelected.title : null;
  }

  public openFilter(): void {
    this.advancedSearchShape = true;
    this.visibleModal(false, false, false, false, false, false, true, false, false, true);
  }
  public requestHelp(modal: string): void {
    this.sectionSelected = modal;
    switch (modal) {
      case 'buffer':
        this.visibleModal(false, false, true, false, true, false, false, false, false, false);
        break;
      case 'h-medir':
        this.visibleModal(false, false, false, false, true, true, false, false, false, false);
        break;
      case 'h-extraer':
        this.visibleModal(false, false, false, true, true, false, false, false, false, false);
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
    this.contractMenu = !this.contractMenu;
    const elements = document.getElementsByClassName('ui-menuitem-text');
    const icons = document.getElementsByClassName('ui-submenu-icon pi pi-fw pi-caret-right ng-star-inserted');
    const menu = document.getElementsByClassName('ui-tieredmenu')[0];
    if (elements != null && elements !== undefined) {
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        if (this.validateHiddenElement(element.textContent)) {
          if (this.contractMenu) {
            menu.setAttribute('style', 'padding: 0; background-color: #ffffff; border: none; width: auto;');
            element.setAttribute('style', 'display: initial;');
          } else {
            menu.setAttribute('style', 'padding: 0; background-color: #ffffff; border: none; width: 45px;');
            element.setAttribute('style', 'display: none;');
          }
        }
      }
    }
    if (icons != null && icons !== undefined) {
      for (let index = 0; index < icons.length; index++) {
        const element = icons[index];
        if (this.contractMenu) {
          element.setAttribute('style', 'display: initial;');
        } else {
          element.setAttribute('style', 'display: none;');
          this.loaded = true;
        }
      }
    }
    if (this.contractMenu && document.getElementsByClassName('esri-icon-collapse')[0] !== undefined) {
      document.getElementsByClassName('esri-icon-collapse')[0].classList.add('esri-icon-expand');
      document.getElementsByClassName('esri-icon-expand')[0].classList.remove('esri-icon-collapse');
    } else if (!this.contractMenu && document.getElementsByClassName('esri-icon-expand')[0] !== undefined) {
      document.getElementsByClassName('esri-icon-expand')[0].classList.add('esri-icon-collapse');
      document.getElementsByClassName('esri-icon-collapse')[0].classList.remove('esri-icon-expand');
    }
  }

  public validateHiddenElement(menu: string): boolean {
    let isValid = false;
    for (const item of this.menu) {
      if (item.label === menu) {
        isValid = true;
        break;
      }
    }
    return isValid;
  }

  public openExtract(): void {
    if (!this.errorArcgisService) {
      this.headerExtract = 'Descargar capa';
      this.layerExtract = true;
      this.buildOptionsLayers();
      this.visibleModal(false, false, false, true, false, false, false, false, false, false);
      this.view.popup.autoOpenEnabled = false;
    }
  }

  public openMeasuringTools(): void {
    if (!this.errorArcgisService) {
      this.visibleModal(false, false, false, false, false, true, false, false, false, false);
      this.view.popup.autoOpenEnabled = false;
      (window as any).ga('send', 'event', 'BUTTON', 'click', 'open-measure-menu');
    }
  }

  public openEnabledPopup(): void {
    console.log(this.map);
    if (!this.errorArcgisService) {
      this.view.popup.autoOpenEnabled = !this.view.popup.autoOpenEnabled;
      if (this.view.popup.autoOpenEnabled) {
        document.getElementsByClassName('esri-view-root')[0].classList.remove('normal-cursor');
        document.getElementsByClassName('esri-view-root')[0].classList.add('help-cursor')
        this.messageService.add({ detail: `Se ha activado la selección de información`, summary: 'Información', severity: 'info' });
      } else {
        document.getElementsByClassName('esri-view-root')[0].classList.remove('help-cursor');
        document.getElementsByClassName('esri-view-root')[0].classList.add('normal-cursor')
        this.messageService.add({ detail: `Se ha desactivado la selección de información`, summary: 'Información', severity: 'info' });
      }
    }
  }

  public viewAll(): void {
    this.view.center = [this.longitude, this.latitude];
    this.view.zoom = 5;
  }

  /**
   * Cambia las opciones de sistema de coordenada
   * segun las unidades de la coordenada
   */
  public onChangeCoordinateUnits() {
    this.optionsCoordinateSystem = this.coordinateUnits.value;
    this.coordinateSystem = this.optionsCoordinateSystem[0].value;
    this.coordinateX = '';
    this.coordinateY = '';
  }

  /**
   *  Procesa la información para localizar una coordenada de entrada
   */
  public locateCoordinate(): void {
    if (this.coordinateX === '' || this.coordinateY === '' || this.coordinateX === undefined || this.coordinateY === undefined) {
      this.messageService.add({
        severity: 'warn',
        summary: '',
        detail: 'Ingrese las coordenadas.'
      });
    } else {
      loadModules(['esri/widgets/CoordinateConversion/CoordinateConversionViewModel', 'esri/Graphic', 'esri/tasks/GeometryService',
        'esri/geometry/Point', 'esri/geometry/SpatialReference', 'esri/tasks/support/ProjectParameters'])
        .then(([CoordinateVM, Graphic, GeometryService, Point, SpatialReference, ProjectParameters]) => {
          const symbol = {
            type: 'picture-marker',  // autocasts as new PictureMarkerSymbol()
            url: 'assets/marker.png',
            width: '18px',
            height: '32px',
            yoffset: '16px'
          };
          if (this.coordinateUnits.code !== 'm') {
            const coordinateVM = new CoordinateVM();
            const format = coordinateVM.formats.items.find(x => x.name === this.coordinateUnits.code);
            let x;
            let y;
            switch (this.coordinateUnits.code) {
              case 'dms':
                x = this.coordinateX.toString().replace(',0000', '');
                y = this.coordinateY.toString().replace(',0000', '');
                break;
              case 'ddm':
                x = this.coordinateX.toString().replace(',000000', '');
                y = this.coordinateY.toString().replace(',000000', '');
                break;
              default:
                x = this.coordinateX.toString();
                y = this.coordinateY.toString();
                break;
            }
            const coor = x + this.lathem + ', ' + y + this.lonhem;
            coordinateVM.reverseConvert(coor, format).then((e) => {
              this.view.graphics.add(new Graphic({
                symbol,
                geometry: e
              }));
              this.view.goTo(e);
            }, (error) => {
              this.messageService.add({
                severity: 'warn',
                summary: '',
                detail: 'No es posible ubicar la coordenada.'
              });
            });
          } else {
            // Geometry Service
            const geomSvc = new GeometryService(this.urlGeometryService);
            const sisRef = new SpatialReference({
              wkid: this.coordinateSystem
            });
            const point = new Point({
              x: this.coordinateX.split('.').join('').replace(',', '.'),
              y: this.coordinateY.split('.').join('').replace(',', '.'),
              spatialReference: sisRef
            });
            const outSR = new SpatialReference({ wkid: 4326 });
            const params = new ProjectParameters({
              geometries: [point],
              outSpatialReference: outSR
            });
            geomSvc.project(params).then((response) => {
              const pto = response[0];
              this.view.graphics.add(new Graphic({
                symbol,
                geometry: pto
              }));
              this.view.goTo(response);
            });
          }
          (window as any).ga('send', 'event', 'FORM', 'submit', 'locate-form');
        });
    }
  }

  public addFormField(): void {
    this.quantityFields += 1;
    this.objectFilter.push('');
    this.values.push('');
    this.logicalOperators.push('');
    this.filterS.push('');
  }

  public removeFormField(index: number): void {
    this.quantityFields -= 1;
    this.objectFilter.splice(index, 1);
    this.values.splice(index, 1);
    this.logicalOperators.splice(index, 1);
    this.filterS.splice(index, 1);
    this.getFilterParams();
  }

  public minimizeMaximizeAttrTable(flag: boolean): void {
    this.minimizeMaximize = flag;
    this.minimizeMaximize ? this.styleClassAttrTable = 'maxTable' : this.styleClassAttrTable = 'minTable';
  }

  public keySort(object: any): string {
    return `attributes.${object}`;
  }
}
