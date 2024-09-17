import { Component } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ChatService } from "../../../shared/chat.service";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { DialogAddMemberToChnlComponent } from "../dialog-add-member-to-chnl/dialog-add-member-to-chnl.component";
import { PofileInfoCardComponent } from "../pofile-info-card/pofile-info-card.component";
import { UsersList } from "../../../interfaces/users-list";
import { CommonFnService } from "../../../shared/common-fn.service";
@Component({
    selector: "app-dialog-show-channel-member",
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: "./dialog-show-channel-member.component.html",
    styleUrl: "./dialog-show-channel-member.component.scss",
})
export class DialogShowChannelMemberComponent {


    constructor(
        public dialogRef: MatDialogRef<DialogShowChannelMemberComponent>,
        public chatService: ChatService,
        public dialog: MatDialog,
        public commonFn: CommonFnService
    ) { }


    closeDialog() {
        this.dialogRef.close();
    }


    openDialogAddMembers() {
        this.dialog.open(DialogAddMemberToChnlComponent, {
            panelClass: "custom-dialog-mid",
        });
    }
}
