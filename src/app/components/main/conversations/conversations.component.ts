import { Component, EventEmitter, Output } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { CommonModule } from "@angular/common";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogAddChannelComponent } from "../../dialogs/dialog-add-channel/dialog-add-channel.component";
import { FirestoreService } from "../../../shared/firestore.service";
import { onSnapshot } from "@angular/fire/firestore";
import { ChannelsList } from "../../../interfaces/channels-list";
import { UsersList } from "../../../interfaces/users-list";
import { ChatService } from "../../../shared/chat.service";
import { DirectmessageService } from "../../../shared/directmessage.service";
import { CurrentuserService } from "../../../shared/currentuser.service";

@Component({
    selector: "app-conversations",
    standalone: true,
    imports: [
        MatExpansionModule,
        MatButtonToggleModule,
        CommonModule,
        MatDialogModule,
        DialogAddChannelComponent,
        MatButtonModule,
    ],
    templateUrl: "./conversations.component.html",
    styleUrl: "./conversations.component.scss",
})
export class ConversationsComponent {
    @Output() threadClose = new EventEmitter<boolean>();
    channelsList: ChannelsList[] = [];
    usersList: UsersList[] = [];


    constructor(
        public dialog: MatDialog,
        public firestore: FirestoreService,
        public chatService: ChatService,
        public DMservice: DirectmessageService,
        private currentUser: CurrentuserService,
    ) {
        this.subChannelsList();
    }


    memberOfChannel(channel: ChannelsList) {
        return channel.channelData.members.some(
            (member) => member.id === this.currentUser.currentUserUid,
        );
    }


    subChannelsList() {
        let ref = this.firestore.channelsRef;
        return onSnapshot(ref, (list) => {
            this.channelsList = [];
            list.forEach((element) => {
                this.channelsList.push(
                    this.chatService.setChannelsListObj(element.data(), element.id),
                );
            });
        });
    }


    openDialog(event: MouseEvent) {
        event.stopPropagation();
        this.dialog.open(DialogAddChannelComponent, {
            panelClass: "custom-dialog",
        });
    }


    closeThread() {
        this.threadClose.emit(false);
        if (window.matchMedia("(max-width: 768px)").matches) {
            this.chatService.mobileOpen = "chat";
        }
    }
}
