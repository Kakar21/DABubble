import { Component, ElementRef, HostListener, Input, ViewChild } from "@angular/core";
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
import { DialogImageComponent } from "../../../dialog-image/dialog-image.component";

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
    pickerPosition = { top: '0px', left: '0px' };
    currentMessagePadnumber: string = "";
    previewUrl: string | ArrayBuffer | null = null;


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

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.isPickerVisible = false;
    }

    togglePicker(context: string, padNr: any, event: MouseEvent) {
        this.isPickerVisible = !this.isPickerVisible;
        this.pickerContext = context;
        this.currentMessagePadnumber = padNr;
        if (this.isPickerVisible) {
            const pickerHeight = 350; // Geschätzte Höhe des Emoji-Pickers
            const pickerWidth = 300; // Geschätzte Breite des Emoji-Pickers

            let top = Math.min(event.clientY, window.innerHeight - pickerHeight);
            let left = Math.min(event.clientX, window.innerWidth - pickerWidth);

            this.pickerPosition = { top: `${top}px`, left: `${left}px` };
        }
    }

    closePicker(event: Event) {
        if (this.isPickerVisible) {
            this.isPickerVisible = false;
            this.pickerContext = "";
            this.currentMessagePadnumber = "";
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
        this.DMSerivce.addReaction(messagePadnr, emoji, this.chatService.selectedUser.id)
            .then(() => console.log("Reaction added"))
            .catch((error) => console.error("Error adding reaction: ", error));
    }

    addOrSubReaction(message: any, reaction: string) {
        this.DMSerivce.addOrSubReaction(message, reaction, this.chatService.selectedUser.id)
            .then(() => console.log("Reaction added or removed"))
            .catch((error) => console.error("Error adding/removing reaction: ", error));
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
        let imageUrl = '';

        if (this.previewUrl) {
            const fileInput = document.getElementById('fileUploadDirectmessage') as HTMLInputElement;
            imageUrl = await this.imageService.uploadFile(fileInput);
            console.log(imageUrl)
            this.clearPreview();
        }

        if ((this.messageText.trim() !== "") || (imageUrl.trim() !== "")) {
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
                imageUrl: imageUrl
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

    openDialogImage(imageUrl: string | ArrayBuffer) {
        this.dialog.open(DialogImageComponent, {
            panelClass: "image-dialog",
            data: imageUrl
        });
    }

    openDialogEditMessage(sendedUserID: string, messageId: string, currentMessage: string, ): void {
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


    onFileSelected(event: any) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                this.previewUrl = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }

    uploadFile(input: HTMLInputElement) {
        this.imageService.uploadFile(input);
    }

    clearPreview() {
        this.previewUrl = null;
    }


}
