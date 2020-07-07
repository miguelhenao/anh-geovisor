import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-dialog-guide',
  templateUrl: './dialog-guide.component.html',
  styleUrls: ['./dialog-guide.component.css']
})
export class DialogGuideComponent implements OnInit, OnChanges {
  @Input() flag: boolean;
  @Input() elementId: string;
  currentSection: string;

  constructor() { }

  ngOnInit() {
  }

  /**
   * Método de escucha para el cambio de información en el componente de Guía de Usuario
   */
  ngOnChanges() {
    this.currentSection = 'h-introduccion';
    if (this.flag && this.elementId !== null) {
      setTimeout(() => {
        document.getElementById(this.elementId).scrollIntoView({ block: 'start', behavior: 'smooth' });
        this.currentSection = this.elementId;
      }, 500);
    }
  }

  /**
   * Método para ir a una sección en particular del componente
   * @param sectionId -> Id de la sección
   */
  onSectionChange(sectionId: string) {
    sectionId = sectionId === undefined ? 'h-introduccion' : sectionId;
    this.currentSection = sectionId;
  }

}
