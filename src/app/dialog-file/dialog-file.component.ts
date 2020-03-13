import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/api';

@Component({
  selector: 'app-dialog-file',
  templateUrl: './dialog-file.component.html',
  styleUrls: ['./dialog-file.component.css']
})
export class DialogFileComponent implements OnInit {
  uploadedFiles: any[] = [];
  dataJSON: Array<any> = [];
  help: any;
  type: string;
  valueCoordenate: string;
  formatError = false;
  constructor(private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.type = '.' + config.data.type;
    this.help = config.data.help;
  }

  ngOnInit() {
    this.valueCoordenate = undefined;
  }
  requestHelp(modal: string): void {
    this.help.requestHelp(modal);
  }

  onUpload(event) {
    const fileName = event.target.elements[0].files[0].name;
    if (fileName.indexOf('.csv') !== -1) {
      this.dialogRef.close({
        data: this.valueCoordenate,
        form: document.getElementById('uploadForm')
      });
    } else if (fileName.indexOf('.json') !== -1) {
      this.processJson(event.target.elements[0].files[0]);
    } else if (fileName.indexOf('.zip') !== -1 || fileName.indexOf('.gpx') !== -1) {
      this.dialogRef.close({
        data: fileName,
        form: document.getElementById('uploadForm')
      });
    } else {
      this.formatError = true;
    }
  }

  validateFormat(event) {
    const fileName = event.target.files[0].name;
    this.formatError = fileName.indexOf(this.type) === -1;
  }

  public processJson(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.dialogRef.close(JSON.parse(reader.result.toString()));
    };
    reader.readAsText(file);
  }
}
