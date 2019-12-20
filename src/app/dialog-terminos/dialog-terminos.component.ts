import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dialog-terminos',
  templateUrl: './dialog-terminos.component.html',
  styleUrls: ['./dialog-terminos.component.css']
})
export class DialogTerminosComponent implements OnInit {

  constructor(private ref: DynamicDialogRef, private router: Router) { }

  ngOnInit() {
  }

  public agreeTerms(): void {
    localStorage.setItem('agreeTerms', 'ok');
    this.ref.close();
  }

  public deagreeTerms(): void {
    window.location.href ="http://www.anh.gov.co/";
  }
}
