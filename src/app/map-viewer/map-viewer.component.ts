import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService, SelectItem, MessageService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked, SimpleChange, OnChanges } from '@angular/core';
import { loadModules } from "esri-loader";
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { DialogTerminosComponent } from '../dialog-terminos/dialog-terminos.component';
import { geojsonToArcGIS } from '@esri/arcgis-to-geojson-utils';
import { ImportCSV } from "./ImportCSV";
import { DialogSymbologyChangeComponent } from '../dialog-symbology-change/dialog-symbology-change.component';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css'],
  providers: [DialogService, MessageService]
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  view: any;
  eventLayer: any;
  displayTable: boolean = false;
  layerSelected: any;
  columnsTable: Array<any> = [];
  latitude: number = 4.6486259;
  longitude: number = -74.2478963;
  displayMedicion: boolean = false;
  dptosSelected: Array<any> = [];
  makingWork: boolean = false;
  featureDptos: Array<any> = [];
  menu: Array<MenuItem> = [];
  loadLayers: number = 0;
  departmentLayer: any;
  graphics: Array<any> = [];
  map: any;
  search: any;
  sourceSearch: Array<any> = [];
  attributeTable: any;
  leftDialog: number = 200;
  about: boolean = false;
  guide: boolean = false;
  activeWidget: any;
  tsLayer: any;
  legend: any;
  agsHost = "anh-gisserver.anh.gov.co";
  agsProtocol = "https";
  mapRestUrl = this.agsProtocol + "://" + this.agsHost + "/arcgis/rest/services/Tierras/Mapa_ANH/MapServer";
  agsDir = "arcgis";
  agsUrlBase = this.agsProtocol + "://" + this.agsHost + "/" + this.agsDir + "/";
  // Url servidor ArcGIS.com para servicios de conversión (sharing)
  sharingUrl = "https://www.arcgis.com"; // importante que sea https para evitar problemas de SSL
  // Url del servicio de impresión
  printUrl = this.agsUrlBase + "rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task";
  nameLayer: string;
  display = false;
  displayAnalisis: boolean = false;
  displayBuffer: boolean = false;
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
  visibleMenu = false;
  importCsv = new ImportCSV();
  bufDistance: string;

  modes: SelectItem[] = [
    { value: 'point', title: 'Punto', icon: 'fa fa-fw fa-circle' },
    { value: 'line', title: 'Línea', icon: 'esri-icon-minus' },
    { value: 'polyline', title: 'Polilínea', icon: 'esri-icon-polyline' },
    { value: 'rectangle', title: 'Rectángulo', icon: 'esri-icon-sketch-rectangle' },
    { value: 'polygon', title: 'Polígono', icon: 'esri-icon-polygon' }
  ];

  constructor(private dialogService: DialogService, private service: MapViewerService, private messageService: MessageService) {
    this.setCurrentPosition();
    if (localStorage.getItem('agreeTerms') == undefined) {
      let dialog = this.dialogService.open(DialogTerminosComponent, {
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
              let dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo',
                data: { type: 'zip' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  if (res.data.indexOf('.zip') !== -1) {
                    this.makingWork = true;
                    (<any>window).ga('send', 'event', 'FORM', 'submit', 'upload-form-shp');
                    this.generateFeatureCollection(res.data, res.form, 'shapefile');
                  }
                }
              });
            }
          },
          {
            label: 'Archivo CSV',
            command: () => {
              let dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo',
                data: { type: 'csv' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  this.makingWork = true;
                  (<any>window).ga('send', 'event', 'FORM', 'submit', 'upload-form-csv');
                  this.importCsv.uploadFileCsv(res.form.elements[0].files, res.data, this.agsUrlBase, this.map, this.view, this.makingWork);
                  this.makingWork = false;
                }
              });
            }
          },
          {
            label: 'Archivo GPX',
            command: () => {
              let dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo',
                data: { type: 'gpx' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  if (res.data.indexOf('.gpx') !== -1) {
                    this.makingWork = true;
                    (<any>window).ga('send', 'event', 'FORM', 'submit', 'upload-form-gpx');
                    this.generateFeatureCollection(res.data, res.form, 'gpx');
                  }
                }
              });
            }
          },
          {
            label: 'Archivo GeoJSON',
            command: () => {
              let dialog = this.dialogService.open(DialogFileComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un archivo GeoJSON',
                data: { type: 'json' }
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  this.makingWork = true;
                  (<any>window).ga('send', 'event', 'FORM', 'submit', 'upload-form-geojson');
                  this.addGeoJSONToMap(res);
                }
              });
            }
          },
          {
            label: 'Servicio KML',
            command: () => {
              let dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio KML',
              });
              dialog.onClose.subscribe(res => {
                console.log(res);
                loadModules(['esri/layers/KMLLayer']).then(([KMLLayer]) => {
                  this.makingWork = true;
                  (<any>window).ga('send', 'event', 'FORM', 'submit', 'services-form-kml');
                  let geo = new KMLLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(geo);
                });
              })
            }
          },
          {
            label: 'Servicio WMS',
            command: () => {
              let dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio WMS',
              });
              dialog.onClose.subscribe(res => {
                console.log(res);
                loadModules(['esri/layers/WMSLayer']).then(([WMSLayer]) => {
                  this.makingWork = true;
                  (<any>window).ga('send', 'event', 'FORM', 'submit', 'services-form-wms');
                  let geo = new WMSLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(geo);
                });
              })
            }
          },
          {
            label: 'Servicio GeoJSON',
            command: () => {
              let dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio geoJSON'
              });
              dialog.onClose.subscribe(res => {
                console.log(res);
                loadModules(['esri/layers/GeoJSONLayer']).then(([GeoJSONLayer]) => {
                  this.makingWork = true;
                  (<any>window).ga('send', 'event', 'FORM', 'submit', 'services-form-geojson');
                  let geo = new GeoJSONLayer({
                    url: res
                  });
                  this.makingWork = false;
                  this.map.add(geo);
                });
              })
            }
          },
          {
            label: 'Servicio CSV',
            command: () => {
              let dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio CSV'
              });
              dialog.onClose.subscribe(res => {
                console.log(res);
                loadModules(['esri/layers/CSVLayer']).then(([CSVLayer]) => {
                  this.makingWork = true;
                  (<any>window).ga('send', 'event', 'FORM', 'submit', 'services-form-csv');
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
              this.display = true;
            }
          }
        ]
      },
      {
        label: 'Herramientas',
        icon: 'fa fa-gear',
        items: [
          /* {
            label: 'Analisis de Cobertura',
            command: () => {
              this.displayAnalisis = true;
              this.attributeTable.expand();
            }
          }, */
          {
            label: 'Zona de Influencia (Buffer)',
            command: () => {
              this.visibleMenu = false;
              this.displayBuffer = true;
            }
          },
          {
            label: 'Cambiar simbologia',
            command: () => {
              let dialog = this.dialogService.open(DialogSymbologyChangeComponent, {
                width: '25%',
                header: 'Cambio de Simbología'
              });
              dialog.onClose.subscribe(res => {
                if (res != undefined) {
                  (<any>window).ga('send', 'event', 'BUTTON', 'click', 'symbol-start');
                  this.makingWork = true;
                  loadModules(['esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleFillSymbol',
                    'esri/symbols/SimpleLineSymbol', 'esri/Color', 'esri/renderers/SimpleRenderer']).then(([
                      SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Color, SimpleRenderer]) => {
                      let defaultSymbol: any;
                      switch (this.departmentLayer.geometryType) {
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
                      let renderer = new SimpleRenderer();
                      renderer.symbol = defaultSymbol;
                      this.layerList.selectedItems.items[0].layer.renderer = renderer;
                    });
                  this.makingWork = false;
                }
              })
            }
          }
        ]
      },
      {
        label: 'Impresión',
        icon: 'fa fa-print',
        command: () => {
          (<any>window).ga('send', 'event', 'BUTTON', 'click', 'print');
          window.print();
        }
      }
    ]
  }

  ngAfterViewChecked() {
    /* let layerList: HTMLCollection = document.getElementsByClassName("esri-layer-list__item--selectable");
    for (let index = 0; index < layerList.length; index++) {
      const element = layerList[index];
      element.addEventListener('click', this.clickItemLayer);
    } */
  }


  /* clickItemLayer: (any) => void = (event: any): void => {
    if (this.layerList.selectedItems.items[0].layer != undefined) {
      let layer = this.layerList.selectedItems.items[0].layer;
      let query = {
        outFields: ["*"],
        returnGeometry: false,
        where: ""
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
      const [Map, MapView, FeatureLayer, LayerList, Print, Search, Expand, AreaMeasurement2D, DistanceMeasurement2D, LabelClass,
        BasemapGallery, SketchViewModel, GraphicsLayer, Graphic, Legend, ScaleBar, esriRequest,
        SimpleFillSymbol, SimpleLineSymbol, Color, ListItem, geometryEngine, SpatialReference, ProjectParameters, GeometryService] =
        await loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer",
          "esri/widgets/LayerList", "esri/widgets/Print", "esri/widgets/Search", "esri/widgets/Expand",
          "esri/widgets/AreaMeasurement2D", "esri/widgets/DistanceMeasurement2D", "esri/layers/support/LabelClass",
          'esri/widgets/BasemapGallery', 'esri/widgets/Sketch/SketchViewModel',
          'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/widgets/Legend', 'esri/widgets/ScaleBar', 'esri/request'
          , 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Color',
          'esri/widgets/LayerList/ListItem', 'esri/geometry/geometryEngine', 'esri/geometry/SpatialReference',
          'esri/tasks/support/ProjectParameters', 'esri/tasks/GeometryService']);

      // Servidor de AGS desde donde se cargan los servicios, capas, etc.

      // Configure the Map
      const mapProperties = {
        basemap: "streets"
      };

      const geomSvc = new GeometryService(this.agsUrlBase + 'rest/services/Utilities/Geometry/GeometryServer');


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

      const ly_pozo = new FeatureLayer(this.mapRestUrl + "/1", {
        id: "Pozo",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_pozo.on("layerview-create", () => {
        this.loadLayers++;
      });

      ly_pozo.load().then(() => {
        let text: string = "";
        for (const field of ly_pozo.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templatePozo = {
          title: "Información Pozo",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_pozo,
          searchFields: ["well_name"],
          displayField: "well_name",
          exactMatch: false,
          outFields: ["*"],
          name: ly_pozo.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_pozo.popupTemplate = templatePozo;
      })

      this.map.add(ly_pozo);

      const ly_rezumadero = new FeatureLayer(this.mapRestUrl + "/0", {
        id: "Rezumadero",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_rezumadero.on("layerview-create", () => {
        this.loadLayers++;
      });

      ly_rezumadero.load().then(() => {
        let text: string = "";
        for (const field of ly_rezumadero.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateRezumadero = {
          title: "Información Rezumadero",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_rezumadero,
          searchFields: ["Rezumadero"],
          displayField: "Rezumadero",
          exactMatch: false,
          outFields: ["*"],
          name: ly_rezumadero.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_rezumadero.popupTemplate = templateRezumadero;
      });

      this.map.add(ly_rezumadero);

      const ly_sismica = new FeatureLayer(this.mapRestUrl + "/2", {
        id: "Sismica 2D",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_sismica.on("layerview-create", () => {
        this.loadLayers++;
      });

      ly_sismica.load().then(() => {
        let text: string = "";
        for (const field of ly_sismica.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateSismica = {
          title: "Información Sismica",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_sismica,
          searchFields: ["SURVEY_NAM"],
          displayField: "SURVEY_NAM",
          exactMatch: false,
          outFields: ["*"],
          name: ly_sismica.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_sismica.popupTemplate = templateSismica;
      });

      this.map.add(ly_sismica);

      const ly_sismica3d = new FeatureLayer(this.mapRestUrl + "/3", {
        id: "Sismica 3D",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_sismica3d.on("layerview-create", () => {
        this.loadLayers++;
      });

      ly_sismica3d.load().then(() => {
        let text: string = "";
        for (const field of ly_sismica3d.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateSismica3d = {
          title: "Información Sismica 3D",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_sismica3d,
          searchFields: ["NOMBRE"],
          displayField: "NOMBRE",
          exactMatch: false,
          outFields: ["*"],
          name: ly_sismica3d.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_sismica3d.popupTemplate = templateSismica3d;
      });

      this.map.add(ly_sismica3d);

      const ly_municipio = new FeatureLayer(this.mapRestUrl + "/5", {
        id: "Municipio",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_municipio.load().then(() => {
        let text: string = "";
        for (const field of ly_municipio.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateMunicipio = {
          title: "Info",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_municipio,
          searchFields: ["NOMBRE_ENT"],
          displayField: "NOMBRE_ENT",
          exactMatch: false,
          outFields: ["*"],
          name: ly_municipio.title
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_municipio.popupTemplate = templateMunicipio;
      })

      ly_municipio.on("layerview-create", () => {
        this.loadLayers++;
      });

      this.map.add(ly_municipio);

      const ly_departamento = new FeatureLayer(this.mapRestUrl + "/4", {
        id: "Departamento",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_departamento.load().then(() => {

        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_departamento,
          searchFields: ["DEPARTAMEN"],
          displayField: "DEPARTAMEN",
          exactMatch: false,
          outFields: ["*"],
          name: ly_departamento.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        let text: string = "";
        for (const field of ly_departamento.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateDepartamento = {
          title: "Info",
          content: text,
          fieldInfos: []
        };
        ly_departamento.popupTemplate = templateDepartamento;
      });

      ly_departamento.on("layerview-create", () => {
        this.loadLayers++;
      });

      this.map.add(ly_departamento);

      this.departmentLayer = ly_departamento;

      const ly_cuencas = new FeatureLayer(this.mapRestUrl + "/6", {
        id: "Cuencas",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_cuencas.load().then(() => {
        let text: string = "";
        for (const field of ly_cuencas.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateCuencas = {
          title: "Info",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_cuencas,
          searchFields: ["NOMBRE", "FID_CUENCA"],
          displayField: "NOMBRE",
          exactMatch: false,
          outFields: ["*"],
          name: ly_cuencas.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_cuencas.popupTemplate = templateCuencas;
      })

      ly_cuencas.on("layerview-create", () => {
        this.loadLayers++;
      });

      this.map.add(ly_cuencas);

      const ly_tierras = new FeatureLayer(this.mapRestUrl + "/8", {
        id: "Tierras",
        opacity: 0.5,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      ly_tierras.load().then(() => {
        let query = {
          outFields: ["*"],
          returnGeometry: false,
          where: ""
        }
        ly_tierras.queryFeatures(query).then((result) => {
          this.featureDptos = result.features;
          this.columnsTable = Object.keys(this.featureDptos[0].attributes);
        }, (err) => {
          console.log(err);
        });
        let searchField: Array<any> = [];
        let text: string = "";
        this.layerSelected = ly_tierras;
        for (const field of ly_tierras.fields) {
          searchField.push(field.name);
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateTierras = {
          title: "Info",
          content: text,
          fieldInfos: []
        };
        let sourceSearch: Array<any> = this.sourceSearch.slice();
        sourceSearch.push({
          layer: ly_tierras,
          searchFields: ["CONTRAT_ID"],
          displayField: "CONTRAT_ID",
          exactMatch: false,
          outFields: ["*"],
          name: ly_tierras.title,
          suggestionsEnabled: true,
        });
        this.sourceSearch = null;
        this.sourceSearch = sourceSearch;
        this.search.sources = this.sourceSearch;
        ly_tierras.popupTemplate = templateTierras;
      });

      ly_tierras.on("layerview-create", () => {
        this.loadLayers++;
      })

      const statesLabelClass = new LabelClass({
        labelExpressionInfo: { expression: "$feature.CONTRAT_ID" },
        symbol: {
          type: "text",  // autocasts as new TextSymbol()
          color: "black",
          haloSize: 1,
          haloColor: "white"
        }
      });

      ly_tierras.labelingInfo = [statesLabelClass];
      this.map.add(ly_tierras);

      const ly_sensibilidad = new FeatureLayer(this.mapRestUrl + "/7", {
        labelExpressionInfo: { expression: "$feature.CONTRAT_ID" },
        id: "Sensibilidad",
        opacity: 0.5,
        visible: false,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      ly_sensibilidad.labelingInfo = [statesLabelClass];
      this.map.add(ly_sensibilidad);

      this.view = new MapView(mapViewProperties);
      this.view.on('click', (e) => {
        (<any>window).ga('send', 'event', 'MAP-CONTROL', 'click', 'overviewMap');
        if (this.activeWidget.viewModel.mode !== undefined) {
          if (this.activeWidget.viewModel.mode === 'capture') {
            var outSR = new SpatialReference({ wkid: 3116 }); // MAGNA-SIRGAS / Colombia Bogota zone
            var params = new ProjectParameters();
            params.geometries = [e.mapPoint];
            params.outSR = outSR;
            geomSvc.project(params).then((response) => {
              console.log(response[0]);
            });
          }
        }
      });

      let layerList = new LayerList({
        selectionEnabled: true,
        multipleSelectionEnabled: true,
        view: this.view,
        listItemCreatedFunction: (event) => {
          var item = event.item;
          if (event.item.layer == ly_departamento) {
            item.actionsSections = [
              [{
                title: "Tabla de Atributos",
                className: "esri-icon-table",
                id: "attr-table"
              }, {
                title: "Analisis de Cobertura",
                className: "esri-icon-description",
                id: "analisis"
              }], [{
                title: "Aumentar opacidad",
                className: "esri-icon-up",
                id: "increase-opacity"
              }, {
                title: "Reducir opacidad",
                className: "esri-icon-down",
                id: "decrease-opacity"
              }]
            ];
          } else {
            item.actionsSections = [
              [{
                title: "Tabla de Atributos",
                className: "esri-icon-table",
                id: "attr-table"
              }], [{
                title: "Aumentar opacidad",
                className: "esri-icon-up",
                id: "increase-opacity"
              }, {
                title: "Reducir opacidad",
                className: "esri-icon-down",
                id: "decrease-opacity"
              }]
            ];
          }
        }
      });
      this.view.when(() => {
        layerList.on("trigger-action", (event) => {
          console.log("ok");
          console.log(event);
          debugger;
          if (event.action.id == "attr-table") {
            let layer = event.item.layer;
            let query = {
              outFields: ["*"],
              returnGeometry: false,
              where: ""
            }
            layer.queryFeatures(query).then((result) => {
              this.featureDptos = result.features;
              this.columnsTable = Object.keys(this.featureDptos[0].attributes);
              this.layerSelected = layer;
              this.displayTable = true;
            }, (err) => {
              console.log(err);
            });
          } else if (event.action.id == "analisis") {
            let layer = event.item.layer;
            let query = {
              outFields: ["*"],
              returnGeometry: false,
              where: ""
            }
            layer.queryFeatures(query).then((result) => {
              let dptos: Array<any> = [];
              for (const r of result.features) {
                let dpto = {
                  attributes: Object.assign({}, r.attributes)
                }
                dptos.push(dpto);
              }
              this.featureDptos = dptos;
              console.log(this.featureDptos);
              this.dptosSelected = [];
              this.layerSelected = layer;
              this.displayAnalisis = true;
            }, (err) => {
              console.log(err);
            });
          }
        });
      });
      let item = new ListItem({ layer: ly_tierras });
      layerList.selectedItems.add(item);
      this.layerList = layerList;
      console.log(this.layerList);
      let layerListExpand = new Expand({
        expandIconClass: "esri-icon-layers",
        expandTooltip: 'Tabla de contenido',
        view: this.view,
        content: layerList,
        group: 'bottom-right',
      })
      this.search = new Search({
        view: this.view,
        sources: this.sourceSearch,
        includeDefaultSources: false
      });
      this.view.ui.add(this.search, {
        position: 'top-right'
      });
      this.view.ui.move(["zoom"], "top-right");
      let print = new Print({
        view: this.view,
        printServiceUrl: "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
      });
      let expandPrint = new Expand({
        expandIconClass: 'esri-icon-download',
        expandTooltip: 'Exportar',
        view: this.view,
        content: print,
        group: 'top-right'
      })

      let legend = new Legend({
        view: this.view,
      });

      this.legend = legend;
      let expandLegend = new Expand({
        expandIconClass: 'esri-icon-layer-list',
        expandTooltip: 'Convenciones',
        view: this.view,
        content: legend,
        group: 'bottom-right'
      });

      let basemapGallery = new BasemapGallery({
        view: this.view
      });
      let expandBaseMapGallery = new Expand({
        expandIconClass: 'esri-icon-basemap',
        expandTooltip: 'Mapa base',
        view: this.view,
        content: basemapGallery,
        group: 'top-right'
      });

      const graphicsLayer = new GraphicsLayer();

      let sketchVM = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });

      sketchVM.on('create', (event) => {
        if (this.view.graphics.length === 1) {
          this.clearGraphics();
        }
        if (event.state === 'complete') {
          this.clearGraphic = true;
          let symbolF = {
            type: 'simple-fill',
            color: [255, 255, 0, 0.25],
            style: 'solid',
            outline: {
              color: [255, 0, 0],
              width: 2,
              style: 'dash-dot'
            }
          };
          let graphic = new Graphic({
            geometry: event.graphic.geometry,
            symbol: symbolF
          });
          this.view.graphics.add(graphic);
        }
      });

      let sketchVMBuffer = new SketchViewModel({
        layer: graphicsLayer,
        view: this.view
      });

      sketchVMBuffer.on('create', (event) => {
        if (event.state === 'complete') {
          this.clearGraphic = true;
          let symbolGeo;
          let geometry = event.graphic.geometry;
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
          let symbolBuffer = {
            type: 'simple-fill',
            color: [255, 0, 0, 0.35],
            style: 'solid',
            outline: {
              color: [255, 0, 0, 0.65], width: 2, style: 'solid'
            }
          };
          let graphic = new Graphic({
            geometry: geometry,
            symbol: symbolGeo
          });
          this.view.graphics.add(graphic);
          if (this.bufDistance !== undefined) {
            var buffer = geometryEngine.geodesicBuffer(geometry, this.bufDistance, this.selectedBuffer.value);
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

      let scaleBar = new ScaleBar({
        style: 'line',
        view: this.view,
        unit: 'dual'
      });

      this.view.ui.add(scaleBar, {
        position: 'bottom-left',
      });

      let attributeTable = new Expand({
        expandIconClass: "esri-icon-table",
        view: this.view,
        mode: 'drawer',
        iconNumber: this.featureDptos.length,
        content: document.getElementById("attributeTable")
      });

      let help = new Expand({
        expandIconClass: 'esri-icon-question',
        view: this.view,
        content: document.getElementById("help"),
        group: 'bottom-right'
      });
      help.expand();
      this.attributeTable = attributeTable;
      this.view.ui.add([expandLegend, layerListExpand, help],
        'bottom-right');
      this.view.ui.add([expandPrint, expandBaseMapGallery], {
        position: 'top-right'
      });
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }
  clearGraphics() {
    this.view.graphics.removeAll();
    this.clearGraphic = false;
  }

  ngOnInit() {
    this.initializeMap();
  }

  ngOnChanges() {
    console.log("cambio");
  }

  onClickItem(event: any): void {
    console.log(event);
  }

  public onHideDialogMedicion(): void {
    this.setActiveButton(null);
    this.setActiveWidget(null);
  }

  public setActiveWidget(type) {
    loadModules(["esri/widgets/DistanceMeasurement2D", "esri/widgets/AreaMeasurement2D", 'esri/widgets/CoordinateConversion']).then((
      [DistanceMeasurement2D, AreaMeasurement2D, CoordinateConversion]) => {
      this.activeWidget != null ? this.activeWidget.destroy() : null;
      this.activeWidget = null;
      let container = document.createElement("div");
      container.id = "divWidget";
      document.getElementById("widgetMeasure").appendChild(container);
      switch (type) {
        case "distance":
          this.activeWidget = new DistanceMeasurement2D({
            view: this.view,
            container: document.getElementById("divWidget")
          });
          this.activeWidget.viewModel.newMeasurement();
          this.setActiveButton(document.getElementById("distanceButton"));
          break;
        case "area":
          this.activeWidget = new AreaMeasurement2D({
            view: this.view,
            container: document.getElementById("divWidget")
          });
          this.activeWidget.viewModel.newMeasurement();
          this.setActiveButton(document.getElementById("areaButton"));
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
    var elements = document.getElementsByClassName("active");
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
    if (selectedButton) {
      selectedButton.classList.add("active");
    }
  }


  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }

  async generateFeatureCollection(fileName, form, fileType) {
    var portalUrl = 'https://www.arcgis.com';
    const [FeatureLayer, Graphic, esriRequest, Field] = await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/request',
      'esri/layers/support/Field']);
    var name = fileName.split('.');
    name = name[0].replace('c:\\fakepath\\', '');
    var params = {
      name: name,
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
    esriRequest(portalUrl + '/sharing/rest/content/features/generate', {
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
    var layerName = featureCollection.data.featureCollection.layers[0].layerDefinition.name;
    var sourceGraphics = [];
    console.log(featureCollection)
    var layers = featureCollection.data.featureCollection.layers.map((layer) => {
      var graphics = layer.featureSet.features.map((feature) => {
        return Graphic.fromJSON(feature);
      });
      sourceGraphics = sourceGraphics.concat(graphics);
      var featureLayer = new FeatureLayer({
        title: layerName,
        objectIdField: "FID",
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
    var filename = featureCollection.layers[0].featureSet.features[0].attributes.name;
    var sourceGraphics = [];
    var layers = featureCollection.layers.map((layer) => {
      var graphics = layer.featureSet.features.map((feature) => {
        return Graphic.fromJSON(feature);
      });
      sourceGraphics = sourceGraphics.concat(graphics);
      var popup = new PopupTemplate({
        title: 'Atributos GPX',
        content: '${*}'
      });
      var featureLayer = new FeatureLayer({
        title: filename,
        objectIdField: "FID",
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
    var sourceGraphics = [];
    var graphics = featureCollection.features.map((feature) => {
      return Graphic.fromJSON(geojsonToArcGIS(feature));
    });
    sourceGraphics = sourceGraphics.concat(graphics);
    const fields = [
      new Field({
        name: "ObjectID",
        alias: "ObjectID",
        type: "oid"
      })
    ];
    var featureLayer = new FeatureLayer({
      title: 'GeoJSON',
      source: graphics,
      fields: fields
    });
    this.map.add(featureLayer);
    this.makingWork = false;
    this.view.goTo(sourceGraphics);
  }

  async addSlider() {
    const [Slider, FeatureLayer, LabelClass] =
      await loadModules(['esri/widgets/Slider', 'esri/layers/FeatureLayer', 'esri/layers/support/LabelClass']);
    this.service.getLayersOfServer(this.mapRestUrl, '?f=pjson').subscribe(success => {
      let timeStops = [];
      let layers = [];
      layers = success.layers;
      layers.forEach(layer => {
        this.nameLayer = layer.name;
        if (this.nameLayer.substr(0, 8).toUpperCase().startsWith('TIERRAS')) {
          let tierrasDate = this.nameLayer.substr(this.nameLayer.length - 10);
          let y = tierrasDate.substr(0, 4);
          let m = tierrasDate.substr(5, 2);
          let d = tierrasDate.substr(8, 2);
          let fecha = new Date(y + '/' + m + '/' + d);
          timeStops.unshift([layer.id, fecha]);
        }
      });
      let monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      let slider = new Slider({
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
            let text: string = '';
            for (const field of lyTierrasMdt.fields) {
              text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
            }
            let templateTierras = {
              title: 'Información',
              content: text,
              fieldInfos: []
            };
            lyTierrasMdt.popupTemplate = templateTierras;
            let sourceSearch = this.sourceSearch.splice(0, 8);
            sourceSearch.push({
              layer: lyTierrasMdt,
              searchFields: ["DEPARTAMEN"],
              displayField: "DEPARTAMEN",
              exactMatch: false,
              outFields: ["*"],
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
          (<any>window).ga('send', 'event', 'TOOL', 'slide', 'ts-tierras');
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
      const features = this.view.graphics.items[0]
      const featureSet = new FeatureSet();
      featureSet.features = features;
      const params = {
        Layers_to_Clip: this.selectedLayers,
        Area_of_Interest: featureSet,
        Feature_Format: 'Shapefile - SHP - .shp'
      };
      gpExtract.submitJob(params).then((jobInfo) => {
        let options = {
          statusCallback: (jobInfo1) => {
          }
        };
        gpExtract.waitForJobCompletion(jobInfo.jobId, options).then((jobInfo2) => {
          if (!jobInfo2.jobStatus.includes('fail')) {
            gpExtract.getResultData(jobInfo.jobId, 'Output_Zip_File').then((outputFile) => {
              var theurl = outputFile.value.url;
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
      (<any>window).ga('send', 'event', 'FORM', 'submit', 'extract');
    }
    this.makingWork = false;
  }

  public onRowSelect(event: any): void {
    loadModules(['esri/tasks/support/Query', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
      'esri/Color', 'dojo/_base/array', 'esri/Graphic']).then(([Query, SimpleFillSymbol, SimpleLineSymbol, Color,
        dojo, Graphic]) => {
        let layer = this.layerSelected;
        let query = layer.createQuery();
        query.where = `${this.columnsTable[0]} = ${event.data.attributes[this.columnsTable[0]]}`;
        query.returnGeometry = true;
        query.outFields = ["*"];
        layer.queryFeatures(query).then((res) => {
          let symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255, 1.0]), 2),
            new Color([0, 0, 0, 0.5]));
          dojo.forEach(res.features, (key) => {
            let graphic = new Graphic({
              geometry: key.geometry,
              symbol: symbol
            });
            this.view.graphics.add(graphic);
            let objectGraphic = {
              attr: event.data.attributes,
              graphic: graphic
            }
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
      if (object.attr != undefined && object.attr == event.data.attributes) {
        this.view.graphics.remove(object.graphic);
        this.graphics.splice(this.graphics.indexOf(object), 1);
        break;
      }
    }
  }

  public generateAnalisisCobertura(): void {
    loadModules(['esri/tasks/support/FeatureSet', 'esri/tasks/Geoprocessor']).
      then(([FeatureSet, Geoprocessor]) => {
        this.makingWork = true;
        this.displayAnalisis = false;
        this.attributeTable.collapse();
        let gpIntersect = new Geoprocessor(this.agsUrlBase + "rest/services/AnalisisCobertura/GPServer/AnalisisCobertura");
        gpIntersect.outSpatialReference = { wkid: 4326 };
        let nameDptos: string = "";
        (<any>window).ga('send', 'event', 'BUTTON', 'click', 'intersect-start');
        for (const dpto of this.dptosSelected) {
          nameDptos = `${nameDptos}'${dpto.attributes.DEPARTAMEN}',`;
        }
        nameDptos = nameDptos.substr(0, nameDptos.length - 1);
        let params = {
          Nombres_Departamentos: nameDptos
        };
        gpIntersect.submitJob(params).then((jobInfo) => {
          let options = {
            statusCallback: (jobInfo1) => {
            }
          };
          gpIntersect.waitForJobCompletion(jobInfo.jobId, options).then((jobInfo2) => {
            if (!jobInfo2.jobStatus.includes('fail')) {
              gpIntersect.getResultData(jobInfo.jobId, 'Output_Zip_File').then((outputFile) => {
                var theurl = outputFile.value.url;
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
    let nameDptos = "";
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

  changeAttrTable(event: any) {
    console.log("Hola");
  }

  onHideDialogAnalisis() {
    this.layerSelected = [];
    this.attributeTable.collapse();
    console.log(this.layerList);
    this.displayAnalisis = false;
  }

  onChangeSelectSketchBuffer() {
    (<any>window).ga('send', 'event', 'BUTTON', 'click', 'buffer');
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

}
