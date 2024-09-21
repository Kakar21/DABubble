import { Component } from "@angular/core";
import { MatBottomSheetModule, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { FirestoreService } from "../../../shared/firestore.service";
import { DialogEditProfileEditProfileComponent } from "../dialog-edit-profile-edit-profile/dialog-edit-profile-edit-profile.component";

@Component({
    selector: "app-bottomsheet-profile-menu",
    standalone: true,
    imports: [MatBottomSheetModule],
    templateUrl: "./bottomsheet-profile-menu.component.html",
    styleUrl: "./bottomsheet-profile-menu.component.scss",
})
export class BottomsheetProfileMenuComponent {
    constructor(
        private _bottomSheetRef: MatBottomSheetRef<BottomsheetProfileMenuComponent>,
        public dialog: MatDialog,
        public firestore: FirestoreService,
    ) { }


    logout() {
        this._bottomSheetRef.dismiss();
        this.firestore.logout();
    }


    openProfile(): void {
        this.dialog.open(DialogEditProfileEditProfileComponent, {});
    }
}
