import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
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

  /**
   * Método de aceptación de términos
   */
  public agreeTerms(): void {
    localStorage.setItem('agreeTerms', 'ok');
    this.ref.close();
  }

  /**
   * Método de rechazo de términos y redirección a la página principal de la ANH
   */
  public deagreeTerms(): void {
    window.location.href = 'http://www.anh.gov.co/';
  }
}
