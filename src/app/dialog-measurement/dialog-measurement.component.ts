import { loadModules } from 'esri-loader';
import { SelectItem } from 'primeng/api';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dialog-measurement',
  templateUrl: './dialog-measurement.component.html',
  styleUrls: ['./dialog-measurement.component.css']
})
export class DialogMeasurementComponent implements OnInit, OnDestroy {
  @Input() _this: any;

  infoTool = true;
  activeWidget: any;
  magnaSirgasFlag = false;
  selectedMeasurement: any;
  modesMeasurement: SelectItem[] = [
    { value: 'area', title: 'Área', icon: 'esri-icon-measure-area' },
    { value: 'distance', title: 'Distancia', icon: 'esri-icon-measure-line' },
    { value: 'coordinate', title: 'Ubicación', icon: 'esri-icon-map-pin' }
  ];
  magnaSirgas = {
    x: null,
    y: null
  };

  message: string;

  constructor() { }

  ngOnInit() {
    this.initializeComponent();
    this.message = 'Seleccione una herramienta.';
  }

  ngOnDestroy(): void {
    this.selectedMeasurement = null;
    this.setActiveWidget();
  }

  /**
   * Instaciación del componente
   */
  async initializeComponent() {
    try {
      const [SpatialReference, ProjectParameters, GeometryService] =
        await loadModules(['esri/geometry/SpatialReference', 'esri/tasks/support/ProjectParameters', 'esri/tasks/GeometryService']);

      const geomSvc = new GeometryService(this._this.urlGeometryService);
      this._this.view.on('click', (e) => {
        if (this.activeWidget !== undefined && this.activeWidget !== null && this.activeWidget.viewModel.mode !== undefined) {
          if (this.activeWidget.viewModel.mode === 'capture') {
            const outSR = new SpatialReference({ wkid: 3116 }); // MAGNA-SIRGAS / Colombia Bogota zone
            const params = new ProjectParameters();
            params.geometries = [e.mapPoint];
            params.outSpatialReference = outSR;
            geomSvc.project(params).then((response) => {
              this.magnaSirgas.x = this.formatNumber(response[0].x, 4);
              this.magnaSirgas.y = this.formatNumber(response[0].y, 4);
              this.magnaSirgasFlag = true;
            });
            this._this.view.goTo({
              target: e.mapPoint,
              zoom: 9
            });
          }
        }
      });

      this._this.view.on('pointer-move', (evt) => {
        if (this.selectedMeasurement === 'coordinate') {
          this.planasXY(this._this.view.toMap({ x: evt.x, y: evt.y }));
        }
      });
    } catch (error) {
      console.error('EsriLoader: ', error);
    }
  }

  /**
   * Método para la activación de una de las herramientas de medición
   */
  public setActiveWidget() {
    loadModules(['esri/widgets/DistanceMeasurement2D', 'esri/widgets/AreaMeasurement2D', 'esri/widgets/CoordinateConversion',
      'esri/widgets/CoordinateConversion/support/Conversion']).then((
        [DistanceMeasurement2D, AreaMeasurement2D, CoordinateConversion, Conversion]) => {
        // tslint:disable-next-line:no-unused-expression
        this.activeWidget != null ? this.activeWidget.destroy() : null;
        this.activeWidget = null;
        const container = document.createElement('div');
        container.id = 'divWidget';
        document.getElementById('widgetMeasure') != null ? document.getElementById('widgetMeasure').appendChild(container) : null;
        this.magnaSirgasFlag = false;
        switch (this.selectedMeasurement) {
          case 'distance':
            this.activeWidget = new DistanceMeasurement2D({
              view: this._this.view,
              container: document.getElementById('divWidget'),
              unit: 'kilometers'
            });
            this.activeWidget.viewModel.newMeasurement();
            this.message = 'Haga <b>clic</b> sobre el mapa para agregar puntos. <b>Doble clic</b> para terminar la medición.';
            break;
          case 'area':
            this.activeWidget = new AreaMeasurement2D({
              view: this._this.view,
              container: document.getElementById('divWidget'),
              unit: 'hectares'
            });
            this.activeWidget.viewModel.newMeasurement();
            this.message = 'Haga <b>clic</b> sobre el mapa para agregar puntos. <b>Doble clic</b> para terminar la medición.';
            break;
          case 'coordinate':
            this.activeWidget = new CoordinateConversion({
              view: this._this.view,
              orientation: 'expand-up',
              container: document.getElementById('divWidget')
            });
            const symbol = {
              type: 'picture-marker',
              url: 'assets/marker.png',
              width: '18px',
              height: '32px',
              yoffset: '16px'
            };
            const formatXY = this.activeWidget.formats.find((f) => {
              return f.name === 'xy';
            });
            this.activeWidget.formats.remove(formatXY);
            formatXY.name = 'grados';
            const xy = formatXY.currentPattern.split(',');
            formatXY.currentPattern = xy[1] + ', ' + xy[0];
            this.activeWidget.formats.push(formatXY);
            const formatBasemap = this.activeWidget.formats.find((f) => {
              return f.name === 'basemap';
            });
            this.activeWidget.formats.remove(formatBasemap);
            this.activeWidget.viewModel.locationSymbol = symbol;
            const ul = document.getElementsByClassName('esri-coordinate-conversion__tools')[0] as HTMLElement;
            ul.getElementsByTagName('li')[0].click();
            this.sleep(500).then(() => {
              const rowTools = document.getElementsByClassName('esri-coordinate-conversion__row')[1] as HTMLElement;
              const tools = rowTools.getElementsByClassName('esri-coordinate-conversion__tools')[0] as HTMLElement;
              tools.getElementsByTagName('li')[0].addEventListener('click', (e: Event) =>
                this._this.visibleModal(false, false, false, false, false, false, false, false, true, false)
              );
              const conversionList = document.getElementById('divWidget__esri-coordinate-conversion__conversion-list');
              const xyPlanas = document.createElement('div');
              const textXy = document.createElement('div');
              textXy.style.width = '20%';
              textXy.style.cssFloat = 'left';
              textXy.innerHTML = 'XY Planas';
              textXy.style.padding = '10px 5px 5px 15px';
              const valueXy = document.createElement('div');
              valueXy.style.width = '80%';
              valueXy.style.cssFloat = 'right';
              valueXy.style.padding = '10px 0px 0px 12px';
              valueXy.id = 'value-xy';
              xyPlanas.appendChild(textXy);
              xyPlanas.appendChild(valueXy);
              conversionList.appendChild(xyPlanas);
            });
            const formatDMS = this.activeWidget.formats.find((f) => {
              return f.name === 'dms';
            });
            this.activeWidget.conversions.removeAll();
            this.activeWidget.conversions.add(new Conversion({ format: formatDMS }));

            this.message = 'Recorra el mapa con el cursor para obtener la coordenada en algún punto.' +
              ' Realice la captura de una coordenada en el <b>Modo Captura</b> o ingrese una coordenada en <b>Coordenada de Entrada</b>';
            break;
          case null:
            if (this.activeWidget) {
              this.activeWidget.destroy();
              this.activeWidget = null;
            }
            break;
        }
      });
  }

  public sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public formatNumber(n, min?) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: min, maximumFractionDigits: 4 });
  }

  /**
   * Método para obtener las coordenadas en formato MAGNA SIRGAS Origen Central Bogotá
   * @param pt -> Punto en el mapa
   */
  public planasXY(pt): void {
    let coords = '';
    loadModules(['esri/tasks/GeometryService', 'esri/geometry/SpatialReference', 'esri/tasks/support/ProjectParameters'])
      .then(([GeometryService, SpatialReference, ProjectParameters]) => {
        const geomSvc = new GeometryService(this._this.urlGeometryService);
        const outSR = new SpatialReference({ wkid: 3116 });
        const params = new ProjectParameters({
          geometries: [pt],
          outSpatialReference: outSR
        });
        geomSvc.project(params).then((response) => {
          const pto = response[0];
          coords = 'N ' + this.formatNumber(pto.y, 4) + ', E ' + this.formatNumber(pto.x, 4);
          const v = document.getElementById('value-xy');
          v !== undefined && v !== null ? v.innerHTML = coords : null;
        });
      });
  }

}
