import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { DialogTerminosComponent } from '../dialog-terminos/dialog-terminos.component';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css'],
  providers: [DialogService]
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  view: any;
  latitude: number = 4.6486259;
  loadLayers: boolean = false;
  longitude: number = -74.2478963;
  menu: Array<MenuItem> = [];
  map: any;
  agsHost = "anh-gisserver.anh.gov.co";
  agsProtocol = "https";
  mapRestUrl = this.agsProtocol + "://" + this.agsHost + "/arcgis/rest/services/Tierras/Mapa_ANH/MapServer";
  agsDir = "arcgis";
  agsUrlBase = this.agsProtocol + "://" + this.agsHost + "/" + this.agsDir + "/";
  // Url servidor ArcGIS.com para servicios de conversión (sharing)
  sharingUrl = "https://www.arcgis.com"; // importante que sea https para evitar problemas de SSL
  // Url del servicio de impresión
  printUrl = this.agsUrlBase + "rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task";

  constructor(private dialogService: DialogService, private service: MapViewerService) {
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
            label: 'A Shapefile'
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
      },
      {
        label: 'Mapa base',
        icon: 'fa fa-globe',
        items: [
          {
            label: 'Imagenes',
            command: () => {
              this.view.map.basemap = 'satellite';
            }
          },
          {
            label: 'Imagenes con etiquetas',
            command: () => {
              this.view.map.basemap = 'hybrid';
            }
          },
          {
            label: 'Calles',
            command: () => {
              this.view.map.basemap = 'streets';
            }
          },
          {
            label: 'Topográfico',
            command: () => {
              this.view.map.basemap = 'topo';
            }
          },
          {
            label: 'Lona gris oscuro',
            command: () => {
              this.view.map.basemap = 'dark-gray';
            }
          },
          {
            label: 'Lona gris claro',
            command: () => {
              this.view.map.basemap = 'gray';
            }
          },
          {
            label: 'National Geographic',
            command: () => {
              this.view.map.basemap = 'national-geographic';
            }
          },
          {
            label: 'Terreno con etiquetas',
            command: () => {
              this.view.map.basemap = 'terrain';
            }
          },
          {
            label: 'Océanos',
            command: () => {
              this.view.map.basemap = 'oceans';
            }
          },
          {
            label: 'OpenStreetMap',
            command: () => {
              this.view.map.basemap = 'osm';
            }
          }
        ]
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
        DistanceMeasurement2D, LabelClass,
        BasemapGallery] = await loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer",
          "esri/widgets/LayerList", "esri/widgets/Print", "esri/widgets/Search", "esri/widgets/Expand",
          "esri/widgets/AreaMeasurement2D", "esri/widgets/DistanceMeasurement2D", "esri/layers/support/LabelClass",
          'esri/widgets/BasemapGallery']);

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

      const ly_pozo = new FeatureLayer(this.mapRestUrl + "/1", {
        id: "Pozo",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
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
      this.map.add(ly_rezumadero);

      const ly_sismica = new FeatureLayer(this.mapRestUrl + "/2", {
        id: "Sismica 2D",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
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
      this.map.add(ly_sismica3d);

      const ly_municipio = new FeatureLayer(this.mapRestUrl + "/5", {
        id: "Municipio",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
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
      /* ly_departamento.load().then(function() {
        alert('Cargo')
      }) */
      this.map.add(ly_departamento);

      const ly_cuencas = new FeatureLayer(this.mapRestUrl + "/6", {

        id: "Cuencas",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      this.map.add(ly_cuencas);

      const templateTierras = {
        title: "Info",
        content: "<b>SHAPE:</b> {SHAPE.type}<br><b>CONTRATO ID:</b> {CONTRAT_ID}<br><b>NOMBRE CONTRATO:</b> {CONTRATO_N}<br><b>NOMBRE ÁREA:</b> {AREA_NOMBR}<br><b>CLASIFICACIÓN:</b> {CLASIFICAC}<br><b>TIPO DE CONTRATO:</b> {TIPO_CONTR}<br><b>ESTADO AREA:</b> {ESTAD_AREA}<br><b>OPERADOR:</b> {OPERADOR}<br><b>CUENCA SEDIMENTARIA:</b> {CUENCA_SED}<br><b>AREA__Ha_:</b> {AREA__Ha_}<br><b>SHAPE_Length:</b> {SHAPE_Length}<br><b>SHAPE_Area:</b> {SHAPE_Area}",
        fieldInfos: []
      };

      const ly_tierras = new FeatureLayer(this.mapRestUrl + "/8", {
        id: "Tierras",
        opacity: 0.5,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND,
        popupTemplate: templateTierras
      });

      const statesLabelClass = new LabelClass({
        labelExpressionInfo: { expression: "$feature.CONTRAT_ID" },
        symbol: {
          type: "text",  // autocasts as new TextSymbol()
          color: "black",
          haloSize: 1,
          haloColor: "white"
        }
      });

      ly_tierras.labelingInfo = [ statesLabelClass ];
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

      this.view.ui.add([expandPrint, layerListExpand, expandAreaMeasure, expandLinearMeasure, expandBaseMapGallery], 'bottom-right');
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
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
}
