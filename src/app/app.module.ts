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
import { DialogFileComponent } from './dialog-file/dialog-file.component';
import {FileUploadModule} from 'primeng/fileupload';
import {TooltipModule} from 'primeng/tooltip';
import { DialogTerminosComponent } from './dialog-terminos/dialog-terminos.component';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import {TableModule} from 'primeng/table';
import {MessageModule} from 'primeng/message';
import { AttributesTableComponent } from './attributes-table/attributes-table.component';
import {RadioButtonModule} from 'primeng/radiobutton';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ColorPickerModule} from 'primeng/colorpicker';
import { DialogSymbologyChangeComponent } from './dialog-symbology-change/dialog-symbology-change.component';

@NgModule({
  declarations: [
    AppComponent,
    MapViewerComponent,
    DialogUrlServiceComponent,
    DialogFileComponent,
    DialogTerminosComponent,
    AttributesTableComponent,
    DialogSymbologyChangeComponent
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
    HttpClientModule,
    FileUploadModule,
    TooltipModule,
    DialogModule,
    DropdownModule,
    MultiSelectModule,
    ToastModule,
    TableModule,
    RadioButtonModule,
    SelectButtonModule,
    MessageModule,
    ColorPickerModule
  ],
  providers: [],
  entryComponents: [
    DialogUrlServiceComponent,
    DialogFileComponent,
    DialogTerminosComponent,
    DialogSymbologyChangeComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
