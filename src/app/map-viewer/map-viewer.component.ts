import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import Map from 'arcgis-js-api/Map';
import MapView from 'arcgis-js-api/views/MapView';
import FeatureLayer from 'arcgis-js-api/layers/FeatureLayer';
import GeoJSONLayer from 'arcgis-js-api/layers/GeoJSONLayer';
import { risaralda } from './../../assets/municipiosRisaralda';
import { MapViewerService } from './map-viewer.service';
import * as _terraformer_ from 'terraformer-arcgis-parser';

declare global {
  const terraformer: typeof _terraformer_;
}

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css']
})
export class MapViewerComponent implements OnInit, OnDestroy {
  map;
  // The <div> where we will place the map
  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  view: any;

  constructor(private service: MapViewerService) { }

  async initializeMap() {
    try {
      // Configure the Map
      const mapProperties = {
        basemap: 'streets'
      };

      this.map = new Map(mapProperties);

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [0.1278, 51.5074],
        zoom: 10,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);
      return this.view;
    } catch (error) {
      console.log('Esri: ', error);
    }
  }

  ngOnInit() {
    this.initializeMap();
    this.loadlayer();
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }

  loadlayer() {
    this.service.getJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson').subscribe(success => {
      console.log(success);
      const geoJSONLayer = new GeoJSONLayer({
        data: success
      });
      this.map.add(geoJSONLayer);
    });
  }
}
