import { Component, Inject, ViewChild } from "@angular/core";
import { Dialog } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogActions,
    MatDialogModule,
} from "@angular/material/dialog";
import { MatMenu, MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogRef} from '@angular/material/dialog';
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

    constructor(
        public dialogRef: MatDialogRef<DialogEditMessageComponent>, // Hier wird `dialogRef` korrekt definiert
        @Inject(MAT_DIALOG_DATA) public data: { message: string }
      ) {
        this.messageControl = new FormControl(this.data.message, [Validators.required]); // Initialisierung von `messageControl`
      }
    togglePicker() {
        this.isPickerVisible = !this.isPickerVisible;
    }

    addEmoji(event: any) {
        console.log(event.emoji);
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
