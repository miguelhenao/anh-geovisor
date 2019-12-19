import { MapViewerService } from './map-viewer.service';
import { DialogGeoJsonServiceComponent } from './../dialog-geo-json-service/dialog-geo-json-service.component';
import { MenuItem, DialogService } from 'primeng/api';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";

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
            label: 'Servicio KML'
          },
          {
            label: 'Servicio WMS'
          },
          {
            label: 'Servicio GEOJson',
            command: () => {
              let dialog = this.dialogService.open(DialogGeoJsonServiceComponent, {
                width: '50%',
                baseZIndex: 20,
                header: 'Cargar un servicio'
              });
              dialog.onClose.subscribe(res => {
                console.log(res);
                /* loadModules(['esri/layers/GeoJSONLayer']).then(([GeoJSONLayer]) => {
                  let geo = new GeoJSONLayer({
                    url: res
                  });
                  this.map.add(geo);
                }); */
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
        icon: 'fa fa-print'
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
    document.getElementsByClassName('esri-view')[0] != undefined ? document.getElementsByClassName('esri-view')[0].setAttribute('style', `height: ${window.innerHeight}`) : null;
    document.getElementsByClassName('esri-ui-inner-container esri-ui-corner-container')[0] != undefined ? document.getElementsByClassName('esri-ui-inner-container esri-ui-corner-container')[0].setAttribute('style', 'left: 97%; top: 15px;') : null;
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
      const [Map, MapView, FeatureLayer, GeoJSONLayer] = await loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/layers/GeoJSONLayer"]);

      // Configure the Map
      const mapProperties = {
        basemap: "streets"
      };

      const map = new Map(mapProperties);

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [this.longitude, this.latitude],
        zoom: 5,
        map: map
      };

      let trailsLayer = new FeatureLayer({
        url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
      });

      map.add(trailsLayer, 0);

      // Parks and open spaces (polygons)
      let parksLayer = new FeatureLayer({
        url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
      });

     /*  map.add(parksLayer, 0);
      let geoJSONLayer = new GeoJSONLayer({
        url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
        copyright: "USGS Earthquakes",
      });
      map.add(geoJSONLayer) */
      this.view = new MapView(mapViewProperties);

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