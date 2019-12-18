import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { loadModules } from "esri-loader";

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css']
})
export class MapViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  view: any;

  constructor() { }

  ngAfterViewChecked() {
    document.getElementsByClassName('esri-view')[0] != undefined ? document.getElementsByClassName('esri-view')[0].setAttribute('style', `height: ${window.innerHeight}`) : null;
  }

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [Map, MapView] = await loadModules(["esri/Map", "esri/views/MapView"]);

      // Configure the Map
      const mapProperties = {
        basemap: "streets"
      };

      const map = new Map(mapProperties);

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [0.1278, 51.5074],
        zoom: 10,
        map: map
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
      // destroy the map view
      this.view.container = null;
    }
  }
}