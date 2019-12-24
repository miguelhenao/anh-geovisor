import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef } from 'primeng/api';

@Component({
  selector: 'app-dialog-file',
  templateUrl: './dialog-file.component.html',
  styleUrls: ['./dialog-file.component.css']
})
export class DialogFileComponent implements OnInit {
  uploadedFiles: any[] = [];
  constructor(private dialogRef: DynamicDialogRef) { }

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
    } else {
      this.dialogRef.close({
        data: event.target.elements[0].value.toLowerCase(),
        form: document.getElementById('uploadForm')
      });
    }
  }
}
