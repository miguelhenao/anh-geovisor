import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapViewerService {
  constructor(private http: HttpClient) { }

  public getLayersOfServer(url: string, json: string): Observable<any> {
    return this.http.get(url + json);
  }

  public validateServices(url: string): Observable<any> {
    return this.http.get(url + '?f=pjson');
  }
}
