import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { ChatComponent } from "../chat/chat.component";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DialogChannelInfoComponent } from "../../dialogs/dialog-channel-info/dialog-channel-info.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { ConversationsComponent } from "../conversations/conversations.component";
import { UsersList } from "../../../interfaces/users-list";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { serverTimestamp } from "@angular/fire/firestore";
import { PofileInfoCardComponent } from "../../dialogs/pofile-info-card/pofile-info-card.component";
import { FormsModule, ReactiveFormsModule, FormControl } from "@angular/forms";
import { Message } from "../../../interfaces/message";
import { DirectmessageService } from "../../../shared/directmessage.service";
import { MatMenuModule } from "@angular/material/menu";
import { ChatService } from "../../../shared/chat.service";
import { CurrentuserService } from "../../../shared/currentuser.service";
import { ImageService } from "../../../shared/image.service";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { map, Observable, startWith } from "rxjs";
import { EmojiModule, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { DialogEditMessageComponent } from "../../dialogs/dialog-edit-message/dialog-edit-message.component";
import { HighlightMentionsPipe } from "../../../pipes/highlist-mentions.pipe";
import { DialogImageComponent } from "../../dialogs/dialog-image/dialog-image.component";
import { CommonFnService } from "../../../shared/common-fn.service";

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
export class DirectMessageComponent implements OnInit {
    @ViewChild("messageInput") messageInput!: ElementRef<HTMLInputElement>;
    isPickerVisible = false;
    messageText: string = "";
    formCtrl = new FormControl();
    filteredMembers: Observable<UsersList[]>;
    currentInputValue: string = "";
    pickerContext: string = "";
    pickerPosition = { top: '0px', left: '0px' };
    currentMessagePadnumber: string = "";
    previewUrl: string | ArrayBuffer | null = null;
    perLineCount = 9;
    recentEmojis: string[] = [];


    constructor(
        public dialog: MatDialog,
        public DMSerivce: DirectmessageService,
        public chatService: ChatService,
        public currentUser: CurrentuserService,
        public imageService: ImageService,
        public commonFnService: CommonFnService

    ) {
        this.filteredMembers = this.formCtrl.valueChanges.pipe(
            startWith(""),
            map((value: string | null) => (value ? this.commonFnService._filter(value) : [])),
        );
    }


    ngOnInit(): void {
        this.focusOnMessageInputIfDirectMessage();
        this.subscribeToComponentChange();
        this.commonFnService.loadRecentEmojis();
    }


    private focusOnMessageInputIfDirectMessage(): void {
        if (this.chatService.openComponent == 'directMessage') {
            setTimeout(() => {
                this.messageInput.nativeElement.focus();
            }, 100);
        }
    }


    private subscribeToComponentChange(): void {
        this.chatService.openedComponent.subscribe((component) => {
            if (component === 'directMessage') {
                this.resetMessageInput();
            }
        });
    }


    private resetMessageInput(): void {
        setTimeout(() => {
            this.messageInput.nativeElement.value = '';
            this.messageInput.nativeElement.focus();
        }, 100);
    }


    objectKeys(obj: any): string[] {
        return Object.keys(obj);
    }


    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.isPickerVisible = false;
    }


    togglePicker(context: string, padNr: any, event: MouseEvent): void {
        this.setPickerProperties(context, padNr);
        if (this.isPickerVisible) {
            this.calculatePickerPosition(event);
        }
    }


    private setPickerProperties(context: string, padNr: any): void {
        this.perLineCount = window.matchMedia("(max-width: 350px)").matches ? 8 : 9;
        this.isPickerVisible = !this.isPickerVisible;
        this.pickerContext = context;
        this.currentMessagePadnumber = padNr;
    }


    private calculatePickerPosition(event: MouseEvent): void {
        const pickerHeight = 350;
        const pickerWidth = 300;
        const buttonWidth = 50;

        let top = Math.min(event.clientY, window.innerHeight - pickerHeight);
        let left = Math.min(event.clientX - pickerWidth - buttonWidth, window.innerWidth - pickerWidth);

        this.pickerPosition = { top: `${top}px`, left: `${left}px` };
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
        setTimeout(() => {
            this.commonFnService.loadRecentEmojis();  // Refresh recent emojis after a delay
        }, 100);
    }


    addReaction(emojiId: string, messagePadnr: string) {
        let emoji = this.commonFnService.getEmojiById(emojiId) || '';
        this.addReactionToMessage(messagePadnr, emoji);  // Use emoji string directly for reaction
        setTimeout(() => {
            this.commonFnService.loadRecentEmojis();  // Refresh recent emojis after reaction
        }, 100);
    }


    addReactionToMessage(messagePadnr: string, emoji: string) {
        this.DMSerivce.addReaction(messagePadnr, emoji, this.chatService.selectedUser.id)
            .catch((error) => console.error("Error adding reaction: ", error));
    }


    addOrSubReaction(message: any, reaction: string) {
        this.DMSerivce.addOrSubReaction(message, reaction, this.chatService.selectedUser.id)
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
        }
    }


    async send(): Promise<void> {
        const imageUrl = await this.handleImageUpload();
        if (this.shouldSendMessage(imageUrl)) {
            const message = this.buildMessage(imageUrl);
            await this.DMSerivce.sendMessage(this.chatService.selectedUser.id, message);
            this.clearMessageText();
        }
    }


    private async handleImageUpload(): Promise<string> {
        if (!this.previewUrl) return '';

        const fileInput = document.getElementById('fileUploadDirectmessage') as HTMLInputElement;
        const imageUrl = await this.imageService.uploadFile(fileInput);
        this.clearPreview();
        return imageUrl;
    }


    private shouldSendMessage(imageUrl: string): boolean {
        return this.messageText.trim() !== "" || imageUrl.trim() !== "";
    }


    private buildMessage(imageUrl: string): Message {
        return {
            id: "",
            avatar: "",
            name: "",
            time: new Date().toISOString(),
            message: this.messageText,
            createdAt: serverTimestamp(),
            reactions: {},
            padNumber: "",
            btnReactions: [],
            imageUrl: imageUrl,
        };
    }


    private clearMessageText(): void {
        this.messageText = "";
    }



    isLater(newMessageTime: string, index: number): boolean {
        const previousMessage = this.DMSerivce.messages[this.commonFnService.padNumber(index, 4)];

        if (!previousMessage) {
            return false;
        }

        const previousMessageTime = previousMessage.time;
        const previousMessageDate = new Date(previousMessageTime).setHours(0, 0, 0, 0);
        const newMessageDate = new Date(newMessageTime).setHours(0, 0, 0, 0);

        return newMessageDate > previousMessageDate;
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


    openDialogEditMessage(sendedUserID: string, messageId: string, currentMessage: string,): void {
        const dialogRef = this.dialog.open(DialogEditMessageComponent, {
            panelClass: 'edit-message-dialog',
            data: { message: currentMessage }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const newContent = result;  // Das ist der neue Inhalt, den der Benutzer eingegeben hat
                this.DMSerivce.updateMessage(sendedUserID, messageId, newContent)
                    .catch(error => console.error('Error updating message:', error));
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


    focusTextarea() {
        this.messageInput.nativeElement.focus();
    }


    clearPreview() {
        this.previewUrl = null;
    }
}
