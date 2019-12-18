import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";
import { MenuItem } from 'primeng/api/menuitem';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css']
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  view: any;
  latitude: number = 4.6486259;
  longitude: number = -74.2478963;
  menu: Array<MenuItem> = [];

  constructor() { 
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
        debugger;
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
    }
  }

  async initializeMap() {
    try {
      const [Map, MapView] = await loadModules(["esri/Map", "esri/views/MapView"]);
      const mapProperties = {
        basemap: "topo"
      };
      const map = new Map(mapProperties);
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [this.longitude, this.latitude],
        zoom: 5,
        map: map,
        sliderPosition: "top-right",
      };
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
      this.view.container = null;
    }
  }
}