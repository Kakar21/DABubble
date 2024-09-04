import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { ChatComponent } from "../chat.component";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DialogChannelInfoComponent } from "../../../dialog-channel-info/dialog-channel-info.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { ConversationsComponent } from "../../conversations/conversations.component";
import { UsersList } from "../../../interfaces/users-list";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { serverTimestamp } from "@angular/fire/firestore";
import { PofileInfoCardComponent } from "../../../pofile-info-card/pofile-info-card.component";
import { DialogAddMemberToChnlComponent } from "../../../dialog-add-member-to-chnl/dialog-add-member-to-chnl.component";
import { FormsModule, ReactiveFormsModule, FormControl } from "@angular/forms";
import { Message } from "../../../interfaces/message";
import { DirectmessageService } from "./directmessage.service";
import { MatMenuModule } from "@angular/material/menu";
import { ChatService } from "../chat.service";
import { CurrentuserService } from "../../../currentuser.service";
import { ImageService } from "../../../image.service";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { map, Observable, startWith } from "rxjs";
import { EmojiModule } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { DialogEditMessageComponent } from "../../../dialog-edit-message/dialog-edit-message.component";
import { HighlightMentionsPipe } from "../../../pipes/highlist-mentions.pipe";

@Component({
    selector: "app-direct-message",
    standalone: true,
    imports: [
    ChatComponent,
    PickerComponent,
    EmojiModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatDialogModule,
    ConversationsComponent,
    MatButtonToggleModule,
    FormsModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    HighlightMentionsPipe
],

    templateUrl: "./direct-message.component.html",
    styleUrl: "./direct-message.component.scss",
})
export class DirectMessageComponent {
    isPickerVisible = false;
    messageText: string = "";
    formCtrl = new FormControl();
    filteredMembers: Observable<UsersList[]>;
    currentInputValue: string = "";
    @ViewChild("messageInput") messageInput!: ElementRef<HTMLInputElement>;
    pickerContext: string = "";
    currentMessagePadnumber: string = "";

    constructor(
        public dialog: MatDialog,
        public DMSerivce: DirectmessageService,
        public chatService: ChatService,
        public currentUser: CurrentuserService,
        public imageService: ImageService,
    ) {
        this.filteredMembers = this.formCtrl.valueChanges.pipe(
            startWith(""),
            map((value: string | null) => (value ? this._filter(value) : [])),
        );
    }

    objectKeys(obj: any): string[] {
        return Object.keys(obj);
    }

    log() {
        console.log();
    }
    togglePicker(context: string, padNr: any, event: MouseEvent) {
        this.isPickerVisible = !this.isPickerVisible;
        this.pickerContext = context;
        this.currentMessagePadnumber = padNr;

    }
    closePicker(event: Event) {
        if (this.isPickerVisible) {
            this.isPickerVisible = false;
        }
    }
    addEmoji(event: any) {
        if (this.pickerContext === "input") {
            this.messageText += event.emoji.native;
        } else if (this.pickerContext === "reaction") {
            this.addReactionToMessage(
                this.currentMessagePadnumber,
                event.emoji.native,
            );
        }
    }
    addReactionToMessage(messagePadnr: string, emoji: string) {
        this.chatService
            .addReaction(this.chatService.selectedUser.id, emoji, 'DM', messagePadnr)
            .then(() => console.log("Reaction added"))
            .catch((error) => console.error("Error adding reaction: ", error));
    }

    addOrSubReaction(message: any, reaction: any,) {
        debugger
        this.chatService.addOrSubReaction(message, reaction, 'DM', this.chatService.selectedUser.id)
    }

    openDialogChannelInfo() {
        this.dialog.open(DialogChannelInfoComponent, {
            panelClass: "custom-dialog-br",
        });
    }

    openProfileById(userId: string) {
        const user = this.chatService.usersList.find(
            (u) => u.id === userId,
        );
        if (user) {
            this.dialog.open(PofileInfoCardComponent, {
                data: user,
            });
        } else {
            console.log("Benutzer nicht gefunden");
        }
    }

    openProfileCard(username: string) {
        const user = this.chatService.usersList.find(
            (u) => u.name === username,
        );
        if (user) {
            this.dialog.open(PofileInfoCardComponent, {
                data: user,
            });
        } else {
            console.log("Benutzer nicht gefunden");
        }
    }

    noReactions(message: Message): boolean {
        return !message.reactions || Object.keys(message.reactions).length === 0;
    }    

    async send() {
        if (this.messageText.trim() !== "") {
            const message: Message = {
                id: "",
                avatar: "",
                name: "", // wird im chat.service übernommen
                time: new Date().toISOString(),
                message: this.messageText,
                createdAt: serverTimestamp(),
                reactions: {},
                padNumber: "",
                btnReactions: [],
                imageUrl: ''
            };

            await this.DMSerivce.sendMessage(
                this.chatService.selectedUser.id,
                message,
            );
            this.messageText = ""; // Textfeld nach dem Senden leeren
        }
    }

    isLater(newMessageTime: string, index: string): boolean {
        const previousMessage = this.DMSerivce.messages[index];

        if (!previousMessage) {
            return false;
        }

        const previousMessageTime = previousMessage.time;

        const previousMessageDate = new Date(previousMessageTime).setHours(
            0,
            0,
            0,
            0,
        );
        const newMessageDate = new Date(newMessageTime).setHours(0, 0, 0, 0);

        return newMessageDate > previousMessageDate;
    }

    dayDate(timestamp: string): string {
        const date = new Date(timestamp);
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const dateToCompare = new Date(date).setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (dateToCompare === today.getTime()) {
            return "Heute";
        } else if (dateToCompare === yesterday.getTime()) {
            return "Gestern";
        }

        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            day: "numeric",
            month: "long",
        };
        return date.toLocaleDateString("de-DE", options);
    }

    dayTime(timestamp: string): string {
        const date = new Date(timestamp);

        const options: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        };
        return date.toLocaleTimeString("de-DE", options);
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Verhindert den Zeilenumbruch
            this.send(); // Nachricht senden
        }
    }

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.currentInputValue = input.value;
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        const selectedUserName = event.option.viewValue;
        this.formCtrl.setValue("", { emitEvent: false });
        this.messageText = this.currentInputValue + `${selectedUserName} `;
        this.currentInputValue = this.messageText;
        this.messageInput.nativeElement.focus();
    }

    private _filter(value: string): UsersList[] {
        if (this.mentionUser(value)) {
            const filterValue = value
                .slice(value.lastIndexOf("@") + 1)
                .toLowerCase();
            return this.chatService.usersList.filter((user) =>
                user.name.toLowerCase().includes(filterValue),
            );
        } else {
            return [];
        }
    }

    mentionUser(value: string): boolean {
        const atIndex = value.lastIndexOf("@");
        if (atIndex === -1) return false;
        const charAfterAt = value.charAt(atIndex + 1);
        return charAfterAt !== " ";
    }

    onMessageClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains("highlight-mention")) {
            const username = target.getAttribute("data-username");
            if (username) {
                this.openProfileCard(username);
            } else {
                console.error("Kein Benutzername definiert für dieses Element");
            }
        }
    }

    addAtSymbol() {
        if (this.messageText.slice(-1) !== "@") {
            this.messageText += "@";
            this.currentInputValue += "@";
        }
        this.messageInput.nativeElement.focus();
    }

    openDialogEditMessage(messageId: string, currentMessage: string, sendedUserID: string): void {
        const dialogRef = this.dialog.open(DialogEditMessageComponent, {
            panelClass: 'edit-message-dialog',
          data: { message: currentMessage }
        });
      
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            const newContent = result;  // Das ist der neue Inhalt, den der Benutzer eingegeben hat
            console.log('Updated content:', newContent);
            this.DMSerivce.updateMessage(sendedUserID, messageId, newContent)
              .then(() => console.log('Message updated successfully'))
              .catch(error => console.error('Error updating message:', error));
          } else {
            console.log('Dialog closed without saving');
          }
        });
      }
      
      


}
