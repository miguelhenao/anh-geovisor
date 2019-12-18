import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapViewerComponent } from './map-viewer/map-viewer.component';


const routes: Routes = [
  {path: '', pathMatch: 'full', component: MapViewerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
