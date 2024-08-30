import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from "@angular/core";
import {
    MatExpansionModule,
    MatExpansionPanel,
} from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { CommonModule } from "@angular/common";
import {
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogAddChannelComponent } from "../../dialog-add-channel/dialog-add-channel.component";
import { FirestoreService } from "../../firestore.service";
import {
    DocumentData,
    collection,
    doc,
    onSnapshot,
} from "@angular/fire/firestore";
import { ChannelsList } from "../../interfaces/channels-list";
import { UsersList } from "../../interfaces/users-list";
import { ChatService } from "../chat/chat.service";
import { DirectmessageService } from "../chat/direct-message/directmessage.service";
import { CurrentuserService } from "../../currentuser.service";

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
                    this.setChannelsListObj(element.data(), element.id),
                );
            });
        });
    }

    setChannelsListObj(obj: any, id: string): ChannelsList {
        return {
            id: id || "",
            channelData: obj || null,
        };
    }

    openDialog(event: MouseEvent) {
        event.stopPropagation();
        console.log(this.firestore.currentUser$);
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
