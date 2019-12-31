import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService, SelectItem, MessageService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { DialogTerminosComponent } from '../dialog-terminos/dialog-terminos.component';
import * as $ from 'jquery';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css'],
  providers: [DialogService, MessageService]
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  view: any;
  latitude: number = 4.6486259;
  longitude: number = -74.2478963;
  menu: Array<MenuItem> = [];
  loadLayers: number = 0;
  map: any;
  leftDialog: number = 200;
  tsLayer: any;
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
  optionsPolygon = [
    { name: 'Polígono', value: 'pol' },
    { name: 'Polígono Libre', value: 'free-pol' }
  ];

  optionsLayers: SelectItem[] = [];
  sketch;
  selectedPolygon: SelectItem;
  selectedLayers: SelectItem[] = [];
  clearGraphic = false;
  visibleMenu = false;

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
                  if (res.data.indexOf('.csv') !== -1) {
                    this.generateFeatureCollection(res.data, res.form, 'csv');
                  }
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
                debugger;
                console.log(res);
                if (res) {
                  loadModules(['esri/layers/GeoJSONLayer', 'esri/layers/FeatureLayer']).then(([GeoJSONLayer, FeatureLayer]) => {
                    debugger;
                    let geo = new FeatureLayer({
                      source: res
                    });
                    this.map.add(geo);
                  });
                }
              })
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
                  let geo = new KMLLayer({
                    url: res
                  });
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
                  let geo = new WMSLayer({
                    url: res
                  });
                  this.map.add(geo);
                });
              })
            }
          },
          {
            label: 'Servicio GEOJson',
            command: () => {
              let dialog = this.dialogService.open(DialogUrlServiceComponent, {
                width: '50%',
                baseZIndex: 100,
                header: 'Cargar servicio GeoJSON'
              });
              dialog.onClose.subscribe(res => {
                console.log(res);
                loadModules(['esri/layers/GeoJSONLayer']).then(([GeoJSONLayer]) => {
                  let geo = new GeoJSONLayer({
                    url: res
                  });
                  this.map.add(geo);
                });
              })
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
          {
            label: 'Analisis de Cobertura'
          },
          {
            label: 'Zona de Influencia (Buffer)'
          },
          {
            label: 'Ubicar coordenada'
          },
          {
            label: 'Cambiar simbologia'
          }
        ]
      },
      {
        label: 'Impresión',
        icon: 'fa fa-print',
        command: () => {
          window.print();
        }
      }
    ]
  }

  ngAfterViewChecked() {
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

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [Map, MapView, FeatureLayer, LayerList, Print, Search, Expand, AreaMeasurement2D,
        DistanceMeasurement2D, LabelClass, BasemapGallery, CoordinateConversion, SketchViewModel, GraphicsLayer, Graphic, Legend] =
        await loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer",
          "esri/widgets/LayerList", "esri/widgets/Print", "esri/widgets/Search", "esri/widgets/Expand",
          "esri/widgets/AreaMeasurement2D", "esri/widgets/DistanceMeasurement2D", "esri/layers/support/LabelClass",
          'esri/widgets/BasemapGallery', 'esri/widgets/CoordinateConversion', 'esri/widgets/Sketch/SketchViewModel',
          'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/widgets/Legend']);

      // Servidor de AGS desde donde se cargan los servicios, capas, etc.

      // Configure the Map
      const mapProperties = {
        basemap: "streets"
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

      this.map.add(ly_sismica3d);

      const ly_municipio = new FeatureLayer(this.mapRestUrl + "/5", {
        id: "Municipio",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

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

      ly_departamento.on("layerview-create", () => {
        this.loadLayers++;
      });

      this.map.add(ly_departamento);

      const ly_cuencas = new FeatureLayer(this.mapRestUrl + "/6", {
        id: "Cuencas",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

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
        let text: string = "";
        for (const field of ly_tierras.fields) {
          text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
        }
        let templateTierras = {
          title: "Info",
          content: text,
          fieldInfos: []
        };
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

      let layerList = new LayerList({
        container: document.createElement("div"),
        view: this.view
      });
      let layerListExpand = new Expand({
        expandIconClass: "esri-icon-layers",
        expandTooltip: 'Tabla de contenido',
        view: this.view,
        content: layerList.domNode,
        group: 'bottom-right',
      })
      let search = new Search({
        view: this.view
      });
      this.view.ui.add(search, {
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
        group: 'bottom-right'
      })

      let areaMeasurement = new AreaMeasurement2D({
        view: this.view
      });
      let expandAreaMeasure = new Expand({
        expandIconClass: 'fas fa-ruler-combined',
        expandTooltip: 'Tomar medidas - Área',
        view: this.view,
        content: areaMeasurement,
        group: 'bottom-right'
      });
      let linearMeasurement = new DistanceMeasurement2D({
        view: this.view
      });
      let expandLinearMeasure = new Expand({
        expandIconClass: 'fas fa-ruler',
        expandTooltip: 'Tomar medidas - Distancia',
        view: this.view,
        content: linearMeasurement,
        group: 'bottom-right'
      });

      let legend = new Legend({
        view: this.view,
      });

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
        group: 'bottom-right'
      });

      var ccWidget = new CoordinateConversion({
        view: this.view
      });

      let expandCcWidget = new Expand({
        expandIconClass: 'esri-icon-sketch-rectangle',
        expandTooltip: 'Ubicación',
        view: this.view,
        content: ccWidget,
        group: 'bottom-right'
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

      this.sketch = sketchVM;

      this.view.ui.add([expandLegend, expandPrint, layerListExpand, expandAreaMeasure, expandLinearMeasure, expandBaseMapGallery, expandCcWidget],
        'bottom-right');
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

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }

  async generateFeatureCollection(fileName, form, fileType) {
    var portalUrl = "https://www.arcgis.com";
    const [FeatureLayer, Graphic, esriRequest, Field] = await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/request',
      'esri/layers/support/Field']);
    var name = fileName.split(".");
    name = name[0].replace("c:\\fakepath\\", "");
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

    var myContent = {
      filetype: fileType,
      publishParameters: JSON.stringify(params),
      f: "json"
    };
    esriRequest(portalUrl + "/sharing/rest/content/features/generate", {
      query: myContent,
      body: form,
      responseType: "json"
    }).then((response) => {
      if (fileType === 'shapefile') {
        this.addShapefileToMap(response);
      } else if (fileType === 'gpx') {
        this.addGpxToMap(response.data.featureCollection);
      }
    }, (err) => {
      console.error(err);
    });

  }

  async addShapefileToMap(featureCollection) {
    const [FeatureLayer, Graphic, Field] = await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/layers/support/Field']);
    var layerName = featureCollection.data.featureCollection.layers[0].layerDefinition.name;
    var sourceGraphics = [];

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
    const [FeatureLayer, PopupTemplate, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color] = await loadModules([
      'esri/layers/FeatureLayer', 'esri/PopupTemplate', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
      'esri/symbols/SimpleMarkerSymbol', 'esri/Color']);
    var filename = featureCollection.layers[0].featureSet.features[0].attributes.name;

    const symbolSelectPt = new SimpleMarkerSymbol({
      style: 'square',
      width: 8,
      color: [0, 50, 0, 1],
      outline: {
        color: [50, 50, 0],
        width: 3
      }
    });

    const symbolSelectPol = new SimpleFillSymbol({
      color: [0, 0, 0, 0.5],
      style: 'solid',
      outline: {
        color: [0, 0, 255],
        width: 3,
        style: 'solid'
      }
    });

    const symbolSelectLn = new SimpleLineSymbol({
      color: [20, 20, 0],
      width: 4,
      style: 'dash'
    });

    featureCollection.layers.forEach((layer) => {
      var popupTemplate = new PopupTemplate({
        title: 'Atributos GPX',
        content: '${*}'
      });
      var layer = new FeatureLayer(layer, {
        popupTemplate: popupTemplate
      });

      layer.name = filename;
      layer.id = layer.name + Math.round(Math.random() * 4294967295).toString(16);
      layer.fromFeatureCollection = true;
      layer.title = filename;
      switch (layer.geometryType) {
        case 'esriGeometryPoint':
          layer.setSelectionSymbol(symbolSelectPt);
          break;
        case 'esriGeometryPolygon':
          layer.setSelectionSymbol(symbolSelectPol);
          break;
        case 'esriGeometryPolyline':
          layer.setSelectionSymbol(symbolSelectLn);
          break;
      }
      var fullExtent = fullExtent ? fullExtent.union(layer.fullExtent) : layer.fullExtent;
      this.map.add(layer);
    });
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
        snapOnClickEnabled: false,
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
            console.log(lyTierrasMdt.fields);
            let text: string = '';
            for (const field of lyTierrasMdt.fields) {
              text = `${text} <b>${field.alias}: </b> {${field.name}} <br>`;
            }
            let templateTierras = {
              title: 'Información',
              // tslint:disable-next-line:max-line-length
              content: text,
              fieldInfos: []
            };
            lyTierrasMdt.popupTemplate = templateTierras;
            console.log(text);
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
      console.log(params);
      gpExtract.submitJob(params).then((jobInfo) => {
        let options = {
          statusCallback: (jobInfo1) => {
            console.log(jobInfo1.jobStatus);
          }
        };
        gpExtract.waitForJobCompletion(jobInfo.jobId, options).then((jobInfo2) => {
          console.log(jobInfo2);
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
    }
  }

  onHideDialogExtract() {
    this.clearGraphics();
    this.selectedLayers = [];
    this.selectedPolygon = undefined;
    this.sketch.cancel();
  }
}
