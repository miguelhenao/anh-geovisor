import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import Map from 'arcgis-js-api/Map';
import MapView from 'arcgis-js-api/views/MapView';
import { GeoJSONLayer } from "arcgis-js-api/layers/GeoJSONLayer";
import { MenuItem } from 'primeng/api';
import { DialogService } from 'primeng/api';
import { DialogGeoJsonServiceComponent } from '../dialog-geo-json-service/dialog-geo-json-service.component';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css'],
  providers: [DialogService]
})
export class MapViewerComponent implements OnInit, OnDestroy {

  // The <div> where we will place the map
  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  view: any;
  latitude: number = 4.6486259;
  longitude: number = -74.2478963;
  menu: Array<MenuItem> = [];
  map: Map;
  
  constructor(private dialogService: DialogService) { 
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
              dialog.onClose.subscribe( res => {
                console.log(res);
                let geoLayout = new GeoJSONLayer({
                  url: res,
                  copyright: "USGS Earthquakes"
                });
                this.map.add(geoLayout);
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
              this.view.map.basemap = "satellite";
            }
          },
          {
            label: 'Imagenes con etiquetas',
            command: () => {
              this.view.map.basemap = "hybrid";
            }
          },
          {
            label: 'Calles',
            command: () => {
              this.view.map.basemap = "streets";
            }
          },
          {
            label: 'Topográfico',
            command: () => {
              this.view.map.basemap = "topo";
            }
          },
          {
            label: 'Lona gris oscuro',
            command: () => {
              this.view.map.basemap = "dark-gray";
            }
          },
          {
            label: 'Lona gris claro',
            command: () => {
              this.view.map.basemap = "gray";
            }
          },
          {
            label: 'National Geographic',
            command: () => {
              this.view.map.basemap = "national-geographic";
            }
          },
          {
            label: 'Terreno con etiquetas',
            command: () => {
              this.view.map.basemap = "terrain";
            }
          },
          {
            label: 'Océanos',
            command: () => {
              this.view.map.basemap = "oceans";
            }
          },
          {
            label: 'OpenStreetMap',
            command: () => {
              this.view.map.basemap = "osm";
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
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
    }
  }

  async initializeMap() {
    try {
      // Configure the Map
      const mapProperties = {
        basemap: 'topo'
      };
      this.map = new Map(mapProperties);
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [this.longitude, this.latitude],
        zoom: 5,
        map: this.map,
        sliderPosition: "top-right",
      };
      this.view = new MapView(mapViewProperties);
      let geoLayout = new GeoJSONLayer({
        url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
        copyright: "USGS Earthquakes"
      });
      this.map.add(geoLayout);
      return this.view;
    } catch (error) {
      console.log('Esri: ', error);
    }
  }

  ngOnInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.view) {
      this.view.container = null;
    }
  }
}
