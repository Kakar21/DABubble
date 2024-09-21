import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { DialogAddChannelAddMemberComponent } from "../dialog-add-channel-add-member/dialog-add-channel-add-member.component";
import { FirestoreService } from "../../../shared/firestore.service";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { BottomsheetAddMemberNewChannelComponent } from "../bottomsheet-add-member-new-channel/bottomsheet-add-member-new-channel.component";

@Component({
    selector: "app-dialog-add-channel",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatDialogActions,
        MatDialogContent,
    ],
    templateUrl: "./dialog-add-channel.component.html",
    styleUrl: "./dialog-add-channel.component.scss",
})
export class DialogAddChannelComponent {
    dataBase = this.firestore.getFirestore();
    channelName: string = "";
    channelDescription: string = "";
    invalidName = false;


    constructor(
        public dialogRef: MatDialogRef<DialogAddChannelComponent>,
        public dialog: MatDialog,
        private firestore: FirestoreService,
        private _bottomSheet: MatBottomSheet,
    ) { }


    closeDialog(): void {
        this.dialogRef.close();
    }


    nameValid() {
        return this.channelName.indexOf(" ") == -1;
    }


    async forwardDialog(): Promise<void> {
        if (this.nameValid() && this.channelName) {
            if (window.matchMedia("(max-width: 768px)").matches) {
                this.openBottomSheet();
            } else {
                this.dialogRef.close();
                this.openDialogAddChannalAddMember();
            }
        } else {
            this.invalidName = true;
        }
    }


    openDialogAddChannalAddMember() {
        this.dialog.open(DialogAddChannelAddMemberComponent, {
            data: {
                channelName: this.channelName,
                channelDescription: this.channelDescription,
            },
        });
    }


    openBottomSheet(): void {
        this._bottomSheet.open(BottomsheetAddMemberNewChannelComponent, {
            data: {
                channelName: this.channelName,
                channelDescription: this.channelDescription,
            },
        });
    }
}
