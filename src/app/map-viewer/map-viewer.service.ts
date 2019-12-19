import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MapViewerService {
  // Servidor de AGS desde donde se cargan los servicios, capas, etc.
  agsHost = 'anh-gisserver.anh.gov.co';
  agsProtocol = 'https';
  mapRestUrl = this.agsProtocol + '://' + this.agsHost + '/arcgis/rest/services/Tierras/Mapa_ANH/MapServer';
  agsDir = 'arcgis';
  agsUrlBase = this.agsProtocol + '://' + this.agsHost + '/' + this.agsDir + '/';
  // Url servidor ArcGIS.com para servicios de conversión (sharing)
  sharingUrl = 'https://www.arcgis.com'; // importante que sea https para evitar problemas de SSL
  // Url del servicio de impresión
  printUrl = this.agsUrlBase + 'rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task';
  // printUrl =  agsUrlBase+"rest/services/ANH_Print/GPServer/Export%20Web%20Map";
  constructor(private http: HttpClient) { }

  public getJson(url: string): Observable<any[]> {
    return this.http.get<any[]>('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson');
  }
}
