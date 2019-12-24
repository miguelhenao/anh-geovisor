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
  type: string;
  constructor(private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.type = config.data.type;
  }

  ngOnInit() {
  }

  onUpload(event) {
    // for (let file of event.files) {
    //   this.uploadedFiles.push(file);
    //   console.log(document.getElementById("uploadForm"));
    //   this.dialogRef.close({
    //     data: this.uploadedFiles[0],
    //     form: document.getElementById('uploadForm')
    //   });
    // }
    let fileName = event.target.elements[0].value.toLowerCase();
    if (fileName.indexOf(".zip") !== -1) {
      this.dialogRef.close({
        data: event.target.elements[0].value.toLowerCase(),
        form: document.getElementById('uploadForm')
      });
    } else if (fileName.indexOf(".json") != -1) {
      this.processJson(event.target.elements[0].files[0]);
    } else {
      this.dialogRef.close({
        data: event.target.elements[0].value.toLowerCase(),
        form: document.getElementById('uploadForm')
      });
    }
  }

  public processJson(file: File): void {
    let reader = new FileReader();
    reader.onload = (e) => {
      this.dialogRef.close(JSON.parse(reader.result.toString()));
    }
    reader.readAsText(file);
  }
}
