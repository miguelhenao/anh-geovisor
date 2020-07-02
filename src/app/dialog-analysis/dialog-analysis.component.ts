import { Component, OnInit, Input } from '@angular/core';
import { loadModules } from 'esri-loader';

@Component({
  selector: 'app-dialog-analysis',
  templateUrl: './dialog-analysis.component.html',
  styleUrls: ['./dialog-analysis.component.css']
})
export class DialogAnalysisComponent implements OnInit {

  @Input() _this: any;
  infoTool = true;

  constructor() { }

  ngOnInit() {
  }

  /**
   * Método encargado de realizar el análisis de cobertura
   */
  public generateAnalisisCobertura(): void {
    loadModules(['esri/tasks/support/FeatureSet', 'esri/tasks/Geoprocessor']).
      then(([, Geoprocessor]) => {
        this._this.makingWork = true;
        this._this.modalAnalysis = false;
        const gpIntersect = new Geoprocessor(this._this.urlAnalisisCobertura);
        gpIntersect.outSpatialReference = { wkid: 4326 };
        let nameDptos = '';
        (window as any).ga('send', 'event', 'BUTTON', 'click', 'intersect-start');
        for (const dpto of this._this.dptosSelected) {
          console.log(dpto);
          nameDptos = `${nameDptos}'${dpto.attributes.departamen}',`;
        }
        nameDptos = nameDptos.substr(0, nameDptos.length - 1);
        const params = {
          Nombres_Departamentos: nameDptos
        };
        gpIntersect.submitJob(params).then((jobInfo) => {
          const options = {
            statusCallback: () => {
            }
          };
          gpIntersect.waitForJobCompletion(jobInfo.jobId, options).then((jobInfo2) => {
            if (!jobInfo2.jobStatus.includes('fail')) {
              gpIntersect.getResultData(jobInfo.jobId, 'Output_Zip_File').then((outputFile) => {
                const theurl = outputFile.value.url;
                window.location = theurl;
              });
            } else {
              this._this.messageService.add({
                severity: 'error',
                summary: '',
                detail: 'Error al generar analisis.'
              });
            }
            this._this.layerSelected = [];
            this._this.clearGraphics();
            this._this.makingWork = false;
          });
        });
      });
  }
}
