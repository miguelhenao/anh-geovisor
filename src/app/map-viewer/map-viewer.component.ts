import { MapViewerService } from './map-viewer.service';
import { DialogUrlServiceComponent } from '../dialog-urlservice/dialog-urlservice.component';
import { MenuItem, DialogService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

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

  constructor(private dialogService: DialogService, private service: MapViewerService) {
    this.setCurrentPosition();
    this.menu = [
      {
        label: 'Mis capas',
        icon: 'pi pi-map-marker',
        items: [
          {
            label: 'Shapefile'
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
                header: 'Cargar un servicio',
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
                header: 'Cargar un servicio',
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
                header: 'Cargar un servicio',
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
    /* document.getElementsByClassName('esri-view')[0] != undefined ? document.getElementsByClassName('esri-view')[0].setAttribute('style', `height: ${window.innerHeight}`) : null;
    document.getElementsByClassName('esri-ui-inner-container esri-ui-corner-container')[0] != undefined ? document.getElementsByClassName('esri-ui-inner-container esri-ui-corner-container')[0].setAttribute('style', 'left: 97%; top: 15px;') : null; */
    document.getElementById('controllers')
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
        PrintTemplate, Search, Expand] = await loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer",
          "esri/layers/GeoJSONLayer", "esri/widgets/LayerList", "esri/widgets/Print", "dojo/_base/array",
          "esri/tasks/support/PrintTemplate", "esri/widgets/Search", "esri/widgets/Expand"]);

      // Servidor de AGS desde donde se cargan los servicios, capas, etc.
      const agsHost = "anh-gisserver.anh.gov.co";
      const agsProtocol = "https";
      const mapRestUrl = agsProtocol + "://" + agsHost + "/arcgis/rest/services/Tierras/Mapa_ANH/MapServer";
      const agsDir = "arcgis";
      const agsUrlBase = agsProtocol + "://" + agsHost + "/" + agsDir + "/";
      // Url servidor ArcGIS.com para servicios de conversión (sharing)
      const sharingUrl = "https://www.arcgis.com"; // importante que sea https para evitar problemas de SSL
      // Url del servicio de impresión
      const printUrl = agsUrlBase + "rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task";

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
        map: map
      };

      const ly_pozo = new FeatureLayer(mapRestUrl + "/1", {
        id: "Pozo",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_pozo);

      const ly_rezumadero = new FeatureLayer(mapRestUrl + "/0", {
        id: "Rezumadero",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_rezumadero);

      const ly_sismica = new FeatureLayer(mapRestUrl + "/2", {
        id: "Sismica 2D",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_sismica);

      const ly_sismica3d = new FeatureLayer(mapRestUrl + "/3", {
        id: "Sismica 3D",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_sismica3d);

      const ly_municipio = new FeatureLayer(mapRestUrl + "/5", {
        id: "Municipio",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_municipio);
      
      const ly_departamento = new FeatureLayer(mapRestUrl + "/4", {
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
      map.add(ly_departamento);

      const ly_cuencas = new FeatureLayer(mapRestUrl + "/6", {
        id: "Cuencas",
        opacity: 1.0,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_cuencas);

      const ly_tierras = new FeatureLayer(mapRestUrl + "/8", {
        id: "Tierras",
        opacity: 0.5,
        visible: true,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });
      map.add(ly_tierras);

      const ly_sensibilidad = new FeatureLayer(mapRestUrl + "/7", {
        id: "Sensibilidad",
        opacity: 0.5,
        visible: false,
        outFields: ["*"],
        showAttribution: true,
        mode: FeatureLayer.MODE_ONDEMAND
      });

      map.add(ly_sensibilidad);
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
      this.view.ui.add([expandPrint, layerListExpand], 'bottom-right');
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
}
