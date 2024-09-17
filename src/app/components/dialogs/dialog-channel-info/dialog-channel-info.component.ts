import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { ChatService } from "../../../shared/chat.service";
import { FormsModule } from "@angular/forms";
import { doc, getFirestore, updateDoc } from "@angular/fire/firestore";
import { CurrentuserService } from "../../../shared/currentuser.service";
import { DialogShowChannelMemberComponent } from "../dialog-show-channel-member/dialog-show-channel-member.component";

@Component({
    selector: "app-dialog-channel-info",
    standalone: true,
    templateUrl: "./dialog-channel-info.component.html",
    styleUrl: "./dialog-channel-info.component.scss",
    imports: [MatButtonModule, FormsModule, DialogShowChannelMemberComponent],
})
export class DialogChannelInfoComponent {
    editingName = false;
    editingDescription = false;
    name = "";
    description = "";
    invalidName = false;
    dataBase = getFirestore();


    constructor(
        public dialogRef: MatDialogRef<DialogChannelInfoComponent>,
        public chatService: ChatService,
        private currentUser: CurrentuserService,
    ) { }


    async leaveChannel() {
        const updatedMembers = this.chatService.currentChannel.members.filter(
            (member) => member.id !== this.currentUser.currentUserUid,
        );

        await updateDoc(
            doc(this.dataBase, "channels", this.chatService.currentChannelID),
            { members: updatedMembers },
        );

        this.chatService.setComponent("");
        this.mobileGoBack();
        this.closeDialog();
    }


    editName() {
        this.name = this.chatService.currentChannel.name;
        this.editingName = true;
    }


    mobileGoBack() {
        this.chatService.mobileOpen = "";
        this.chatService.selectedChannel = "";
        this.chatService.selectedDirectmessage = "";
    }


    async saveName() {
        if (this.nameValid() && this.name) {
            await updateDoc(
                doc(this.dataBase, "channels", this.chatService.currentChannelID),
                { name: this.name },
            );
            this.editingName = false;
        } else {
            this.invalidName = true;
        }
    }


    editDescription() {
        this.description = this.chatService.currentChannel.description;
        this.editingDescription = true;
    }


    async saveDescription() {
        await updateDoc(
            doc(this.dataBase, "channels", this.chatService.currentChannelID),
            { description: this.description },
        );

        this.chatService.currentChannel.description = this.description;
        this.editingDescription = false;
    }


    nameValid() {
        return this.name.indexOf(" ") == -1;
    }


    closeDialog(): void {
        this.dialogRef.close();
    }
}
