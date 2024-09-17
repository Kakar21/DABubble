import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogRef } from "@angular/material/dialog";
import { UsersList } from "../../../interfaces/users-list";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ChatService } from "../../../shared/chat.service";
import { DirectmessageService } from "../../../shared/directmessage.service";

@Component({
    selector: "app-pofile-info-card",
    standalone: true,
    imports: [MatDialogActions, MatButtonModule, MatIconModule],
    templateUrl: "./pofile-info-card.component.html",
    styleUrl: "./pofile-info-card.component.scss",
})
export class PofileInfoCardComponent {


    constructor(
        @Inject(MAT_DIALOG_DATA) public data: UsersList,
        public dialogRef: MatDialogRef<PofileInfoCardComponent>,
        public chatService: ChatService,
        public DMservice: DirectmessageService,
    ) { }


    closeDialog() {
        this.dialogRef.close();
    }


    openDM(user: UsersList) {
        this.dialogRef.close();
        this.chatService.setComponent("directMessage");
        this.DMservice.getMessages(user.id);
        this.chatService.openDirectMessage(user.id);
    }
}
