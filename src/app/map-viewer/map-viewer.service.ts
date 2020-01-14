import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MapViewerService {
  constructor(private http: HttpClient) { }

  public getLayersOfServer(url: string, json: string): any {
    return this.http.get(url + json);
  }
}
