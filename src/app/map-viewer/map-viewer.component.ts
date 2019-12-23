import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
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
                header: 'Cargar un archivo'
              });
              dialog.onClose.subscribe(res => {
                if (res !== undefined) {
                  console.log(res.data);
                  if (res.data.indexOf('.zip') !== -1) {
                    this.generateFeatureCollection(res.data, res.form);
                  }
                }
              });
            }
          },
          {
            label: 'Archivo CSV'
          },
          {
            label: 'Archivo GPZ'
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
                header: 'Cargar servicio GeoJSON',
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
      const [Map, MapView, FeatureLayer, GeoJSONLayer, LayerList, Print, arrayUtils,
        PrintTemplate, Search, Expand, AreaMeasurement2D, DistanceMeasurement2D, Measurement] = await loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer",
          "esri/layers/GeoJSONLayer", "esri/widgets/LayerList", "esri/widgets/Print", "dojo/_base/array",
          "esri/tasks/support/PrintTemplate", "esri/widgets/Search", "esri/widgets/Expand", "esri/widgets/AreaMeasurement2D",
          "esri/widgets/DistanceMeasurement2D", "esri/widgets/TimeSlider"]);

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

      const ly_tierras = new FeatureLayer(this.mapRestUrl + "/8", {
        id: "Tierras",
        opacity: 0.5,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      this.map.add(ly_tierras);

      const ly_sensibilidad = new FeatureLayer(this.mapRestUrl + "/7", {
        id: "Sensibilidad",
        opacity: 0.5,
        visible: false,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      this.map.add(ly_sensibilidad);

      this.view = new MapView(mapViewProperties);

      let layerList = new LayerList({
        container: document.createElement("div"),
        view: this.view
      });
      let layerListExpand = new Expand({
        expandIconClass: "esri-icon-layers",
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
        view: this.view,
        content: print,
        group: 'bottom-right'
      })

      let areaMeasurement = new AreaMeasurement2D({
        view: this.view
      });
      let expandAreaMeasure = new Expand({
        expandIconClass: 'fas fa-ruler-combined',
        view: this.view,
        content: areaMeasurement,
        group: 'bottom-right'
      });
      let linearMeasurement = new DistanceMeasurement2D({
        view: this.view
      });
      let expandLinearMeasure = new Expand({
        expandIconClass: 'fas fa-ruler',
        view: this.view,
        content: linearMeasurement,
        group: 'bottom-right'
      });
      this.view.ui.add([expandPrint, layerListExpand, expandAreaMeasure, expandLinearMeasure], 'bottom-right');
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

  async generateFeatureCollection(fileName, form) {
    var portalUrl = "https://www.arcgis.com";
    const [FeatureLayer, Graphic, esriRequest, Field] = await loadModules(['esri/layers/FeatureLayer', 'esri/Graphic', 'esri/request',
      'esri/layers/support/Field']);
    var name = fileName.split(".");
    // Chrome and IE add c:\fakepath to the value - we need to remove it
    // see this link for more info: http://davidwalsh.name/fakepath
    name = name[0].replace("c:\\fakepath\\", "");

    // define the input params for generate see the rest doc for details
    // https://developers.arcgis.com/rest/users-groups-and-items/generate.htm
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
      filetype: "shapefile",
      publishParameters: JSON.stringify(params),
      f: "json"
    };

    esriRequest(portalUrl + "/sharing/rest/content/features/generate", {
      query: myContent,
      body: form,
      responseType: "json"
    }).then((response) => {
      var layerName = response.data.featureCollection.layers[0].layerDefinition.name;
      var sourceGraphics = [];

      var layers = response.data.featureCollection.layers.map((layer) => {
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

    }, (err) => {
      console.error(err);
    });

  }
}
