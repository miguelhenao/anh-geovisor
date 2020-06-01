import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapViewerComponent } from './map-viewer/map-viewer.component';
import { HttpClientModule } from '@angular/common/http';
import { SidebarModule } from 'primeng/sidebar';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ButtonModule } from 'primeng/button';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { PanelMenuModule } from 'primeng/panelmenu';
import { DialogUrlServiceComponent } from './dialog-urlservice/dialog-urlservice.component';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { DialogFileComponent } from './dialog-file/dialog-file.component';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { DialogTerminosComponent } from './dialog-terminos/dialog-terminos.component';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DialogSymbologyChangeComponent } from './dialog-symbology-change/dialog-symbology-change.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DialogAboutComponent } from './dialog-about/dialog-about.component';
import { DialogGuideComponent } from './dialog-guide/dialog-guide.component';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { InputMaskModule } from 'primeng/inputmask';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ScrollSpyDirective } from './dialog-guide/scroll-spy.directive';
import { DialogMaintenanceComponent } from './dialog-maintenance/dialog-maintenance.component';

@NgModule({
  declarations: [
    AppComponent,
    MapViewerComponent,
    DialogUrlServiceComponent,
    DialogFileComponent,
    DialogTerminosComponent,
    DialogSymbologyChangeComponent,
    DialogAboutComponent,
    DialogGuideComponent,
    ScrollSpyDirective,
    DialogMaintenanceComponent
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
    ColorPickerModule,
    OverlayPanelModule,
    AccordionModule,
    ProgressBarModule,
    TieredMenuModule,
    ConfirmDialogModule,
    InputMaskModule,
  ],
  providers: [
    ConfirmationService
  ],
  entryComponents: [
    DialogUrlServiceComponent,
    DialogFileComponent,
    DialogTerminosComponent,
    DialogSymbologyChangeComponent,
    DialogMaintenanceComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
