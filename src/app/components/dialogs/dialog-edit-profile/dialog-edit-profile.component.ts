import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { DialogEditProfileEditProfileComponent } from "../dialog-edit-profile-edit-profile/dialog-edit-profile-edit-profile.component";
import { FirestoreService } from "../../../shared/firestore.service";

@Component({
    selector: "app-dialog-edit-profile",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatDialogActions,
        MatDialogContent,
    ],
    templateUrl: "./dialog-edit-profile.component.html",
    styleUrl: "./dialog-edit-profile.component.scss",
})
export class DialogEditProfileComponent {


    constructor(
        public dialogRef: MatDialogRef<DialogEditProfileComponent>,
        public dialog: MatDialog,
        public firestore: FirestoreService,
    ) { }


    logout() {
        this.dialogRef.close();
        this.firestore.logout();
    }


    openDialog(event: MouseEvent): void {
        let element = event.target as Element | null;
        if (element) {
            // Casten zu HTMLElement, um Zugriff auf getBoundingClientRect zu gewährleisten.
            let htmlElement = element as HTMLElement;
            let boundingClientRect = htmlElement.getBoundingClientRect();

            // Berechnung der Position, um den Dialog unterhalb des Pfeils zu positionieren.
            let dialogPosition = {
                top: `${boundingClientRect.top + window.scrollY - 30}px`, // Plus window.scrollY für absolute Positionierung auf der Seite
                right: `${window.innerWidth - boundingClientRect.left - boundingClientRect.width + window.scrollX - 30}px`,
            };

            this.openDialogEditProfileEditProfile(dialogPosition);
        }
    }


    openDialogEditProfileEditProfile(dialogPosition: { top: string, right: string; }) {
        this.dialog.open(DialogEditProfileEditProfileComponent, {
            position: dialogPosition,
        });
    }
}
