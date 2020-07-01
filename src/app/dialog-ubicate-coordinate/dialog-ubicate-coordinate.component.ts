import { Component, OnInit, Input } from '@angular/core';
import { loadModules } from 'esri-loader';


@Component({
  selector: 'app-dialog-ubicate-coordinate',
  templateUrl: './dialog-ubicate-coordinate.component.html',
  styleUrls: ['./dialog-ubicate-coordinate.component.css']
})
export class DialogUbicateCoordinateComponent implements OnInit {

  @Input() _this: any;

  optionsCoordinateUnits = [
    {
      name: 'Grados, Minutos y Segundos ( ej. 04° 35\' 46,3215" )',
      value: [{ label: 'MAGNA-SIRGAS (WGS84)', value: 4326 }],
      x: 'Latitud', y: 'Longitud', geographical: true,
      mask: '99° 99\' 99,9999"', code: 'dms'
    },
    {
      name: 'Grados y Minutos Decimales ( ej. 04° 35,772025\' )',
      value: [{ label: 'MAGNA-SIRGAS (WGS84)', value: 4326 }],
      x: 'Latitud', y: 'Longitud', geographical: true,
      mask: '99° 99,999999\'', code: 'ddm'
    },
    {
      name: 'Grados decimales ( ej. 4,59620041° )',
      value: [{ label: 'MAGNA-SIRGAS (WGS84)', value: 4326 }],
      x: 'Latitud', y: 'Longitud', geographical: true,
      mask: '99,99?999999°', code: 'dd'
    },
    {
      name: 'Metros ( ej. 1.106.427 )',
      value: [
        { label: 'MAGNA-SIRGAS Origen Central', value: 3116 },
        { label: 'MAGNA-SIRGAS Origen Este Central', value: 3117 },
        { label: 'MAGNA-SIRGAS Origen Este Este', value: 3118 },
        { label: 'MAGNA-SIRGAS Origen Oeste', value: 3115 },
        { label: 'MAGNA-SIRGAS Origen Oeste Oeste', value: 3114 },
      ],
      x: 'X', y: 'Y', geographical: false, mask: '?9.999.999,9999',
      code: 'm'
    }
  ];
  coordinateUnits = this.optionsCoordinateUnits[0];
  optionsCoordinateSystem = this.coordinateUnits.value;
  coordinateSystem = this.optionsCoordinateSystem[0].value;
  lathem = 'N';
  lonhem = 'O';
  coordinateX: string;
  coordinateY: string;
  clearGraphic = false;
  infoTool = true;
  constructor() { }

  ngOnInit() {
    console.log(this._this);
  }

  /**
   * Cambia las opciones de sistema de coordenada según las unidades de la coordenada
   */
  public onChangeCoordinateUnits() {
    this.optionsCoordinateSystem = this.coordinateUnits.value;
    this.coordinateSystem = this.optionsCoordinateSystem[0].value;
    this.coordinateX = '';
    this.coordinateY = '';
  }

  public formatCoordinatePlane(value, xy) {
    value = value.replace(',', '.') as string;
    value = parseFloat(value);
    value = this.formatNumber(value, 0);
    value = value !== 'NaN' ? value : '';
    if (xy === 'X') {
      this.coordinateX = value;
    } else if (xy === 'Y') {
      this.coordinateY = value;
    }
  }

  public formatNumber(n, min?) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: min, maximumFractionDigits: 4 });
  }

  keypress(event) {
    const value = event.target.value.split(',') as Array<string>;
    if (value.length > 1 && value[1].length === 4) {
      event.preventDefault();
    }
    if (value.length === 1 && event.key !== ',') {
      // tslint:disable-next-line:radix
      const valueInt = parseInt(value[0].split('.').join(''));
      if ((valueInt * 10) >= 2000000 || value[0].length === 9) {
        event.preventDefault();
      }
    }
    if (event.key === ',') {
      if (event.target.value === '' || event.target.value.indexOf(',') !== -1) {
        event.preventDefault();
      }
    }
  }

  public clearGraphics() {
    this._this.view.graphics.removeAll();
  }

  /**
   *  Procesa la información para localizar una coordenada de entrada
   */
  public locateCoordinate(): void {
    if (this.coordinateX === '' || this.coordinateY === '' || this.coordinateX === undefined || this.coordinateY === undefined) {
      this._this.messageService.add({
        severity: 'warn',
        summary: '',
        detail: 'Ingrese las coordenadas.'
      });
    } else {
      loadModules(['esri/widgets/CoordinateConversion/CoordinateConversionViewModel', 'esri/Graphic', 'esri/tasks/GeometryService',
        'esri/geometry/Point', 'esri/geometry/SpatialReference', 'esri/tasks/support/ProjectParameters'])
        .then(([CoordinateVM, Graphic, GeometryService, Point, SpatialReference, ProjectParameters]) => {
          const symbol = {
            type: 'picture-marker',  // autocasts as new PictureMarkerSymbol()
            url: 'assets/marker.png',
            width: '18px',
            height: '32px',
            yoffset: '16px'
          };
          if (this.coordinateUnits.code !== 'm') {
            const coordinateVM = new CoordinateVM();
            const format = coordinateVM.formats.items.find(x => x.name === this.coordinateUnits.code);
            let x;
            let y;
            switch (this.coordinateUnits.code) {
              case 'dms':
                x = this.coordinateX.toString().replace(',0000', '');
                y = this.coordinateY.toString().replace(',0000', '');
                break;
              case 'ddm':
                x = this.coordinateX.toString().replace(',000000', '');
                y = this.coordinateY.toString().replace(',000000', '');
                break;
              default:
                x = this.coordinateX.toString();
                y = this.coordinateY.toString();
                break;
            }
            const coor = x + this.lathem + ', ' + y + this.lonhem;
            coordinateVM.reverseConvert(coor, format).then((e) => {
              this.clearGraphics();
              this._this.view.graphics.add(new Graphic({
                symbol,
                geometry: e
              }));
              this._this.view.goTo({
                target: e,
                zoom: 9
              });
            }, (error) => {
              this._this.messageService.add({
                severity: 'warn',
                summary: '',
                detail: 'No es posible ubicar la coordenada.'
              });
            });
          } else {
            // Geometry Service
            const geomSvc = new GeometryService(this._this.urlGeometryService);
            const sisRef = new SpatialReference({
              wkid: this.coordinateSystem
            });
            const point = new Point({
              x: this.coordinateX.split('.').join('').replace(',', '.'),
              y: this.coordinateY.split('.').join('').replace(',', '.'),
              spatialReference: sisRef
            });
            const outSR = new SpatialReference({ wkid: 4326 });
            const params = new ProjectParameters({
              geometries: [point],
              outSpatialReference: outSR
            });
            geomSvc.project(params).then((response) => {
              const pto = response[0];
              this._this.view.graphics.add(new Graphic({
                symbol,
                geometry: pto
              }));
              this._this.view.goTo({
                target: pto,
                zoom: 9
              });
            });
          }
          (window as any).ga('send', 'event', 'FORM', 'submit', 'locate-form');
        });
    }
  }
}
