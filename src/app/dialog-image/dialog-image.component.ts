import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-image',
  standalone: true,
  imports: [],
  templateUrl: './dialog-image.component.html',
  styleUrl: './dialog-image.component.scss'
})
export class DialogImageComponent {


  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }
}
