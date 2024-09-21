import { Component, HostListener, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogActions } from "@angular/material/dialog";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: "app-dialog-edit-message",
  standalone: true,
  imports: [
    PickerComponent,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatDialogActions,
    ReactiveFormsModule,   // Importiere das ReactiveFormsModule
    MatFormFieldModule,    // Importiere MatFormFieldModule
    MatInputModule,        // Importiere MatInputModule
  ],
  templateUrl: "./dialog-edit-message.component.html",
  styleUrl: "./dialog-edit-message.component.scss",
})
export class DialogEditMessageComponent {
  isPickerVisible: boolean = false;
  messageControl: FormControl;
  perLineCount = 9;

  
  constructor(
    public dialogRef: MatDialogRef<DialogEditMessageComponent>, // Hier wird `dialogRef` korrekt definiert
    @Inject(MAT_DIALOG_DATA) public data: { message: string; }
  ) {
    this.messageControl = new FormControl(this.data.message, [Validators.required]); // Initialisierung von `messageControl`
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isPickerVisible = false;
  }


  togglePicker(event: MouseEvent) {
    if (window.matchMedia("(max-width: 350px)").matches) {
      this.perLineCount = 8;
    } else {
      this.perLineCount = 9;
    }
    this.isPickerVisible = !this.isPickerVisible;
  }


  closePicker(event: Event) {
    if (this.isPickerVisible) {
      this.isPickerVisible = false;
    }
  }


  addEmoji(event: any) {
    // Füge das Emoji an den aktuellen Wert der FormControl an
    const currentValue = this.messageControl.value || ''; // Falls der aktuelle Wert null oder leer ist
    this.messageControl.setValue(currentValue + event.emoji.native);
  }


  onSave(): void {
    if (this.messageControl.valid) {
      // Gib den neuen Wert zurück, wenn das Formular gültig ist
      this.dialogRef.close(this.messageControl.value);
    }
  }


  onCancel() {
    this.dialogRef.close();
  }
}
