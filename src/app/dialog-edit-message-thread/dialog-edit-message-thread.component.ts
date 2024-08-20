import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialog-edit-message-thread',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,   // Importiere das ReactiveFormsModule
    MatFormFieldModule,    // Importiere MatFormFieldModule
    MatInputModule,        // Importiere MatInputModule
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dialog-edit-message-thread.component.html',
  styleUrls: ['./dialog-edit-message-thread.component.scss']
})
export class DialogEditMessageThreadComponent {
  messageControl: FormControl;

  constructor(
    public dialogRef: MatDialogRef<DialogEditMessageThreadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {
    // Initialisiere das FormControl mit dem übergebenen Datenwert
    this.messageControl = new FormControl(this.data.message, [Validators.required]);
  }

  onSave(): void {
    if (this.messageControl.valid) {
      // Gib den neuen Wert zurück, wenn das Formular gültig ist
      this.dialogRef.close(this.messageControl.value);
    }
  }

  onCancel(): void {
    // Schließe den Dialog ohne Änderung
    this.dialogRef.close();
  }
}
