import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapViewerComponent } from './map-viewer/map-viewer.component';
import { HttpClientModule } from '@angular/common/http';
import {SidebarModule} from 'primeng/sidebar';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {ButtonModule} from 'primeng/button';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {PanelMenuModule} from 'primeng/panelmenu';
import { DialogUrlServiceComponent } from './dialog-urlservice/dialog-urlservice.component';
import {DynamicDialogModule} from 'primeng/dynamicdialog';
import {InputTextModule} from 'primeng/inputtext';

@NgModule({
  declarations: [
    AppComponent,
    MapViewerComponent,
    DialogUrlServiceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SidebarModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    PanelMenuModule,
    DynamicDialogModule,
    InputTextModule,
    HttpClientModule
  ],
  providers: [],
  entryComponents: [
    DialogUrlServiceComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
