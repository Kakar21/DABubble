import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges, HostListener, ViewChild, ElementRef } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";
import { ChatService } from "../../../shared/chat.service";
import { Message } from "../../../interfaces/message";
import { FormControl, FormsModule, ReactiveFormsModule, } from "@angular/forms";;
import { CurrentuserService } from "../../../shared/currentuser.service";
import { EmojiModule } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { map, Observable, startWith } from "rxjs";
import { UsersList } from "../../../interfaces/users-list";
import { MatDialog } from '@angular/material/dialog';
import { ThreadService } from "../../../shared/thread.service";
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { ImageService } from "../../../shared/image.service";
import { PofileInfoCardComponent } from "../../dialogs/pofile-info-card/pofile-info-card.component";
import { HighlightMentionsPipe } from "../../../pipes/highlist-mentions.pipe";
import { DialogEditMessageComponent } from "../../dialogs/dialog-edit-message/dialog-edit-message.component";
import { DialogImageComponent } from "../../dialogs/dialog-image/dialog-image.component";
import { CommonFnService } from "../../../shared/common-fn.service";

@Component({
    selector: "app-thread",
    standalone: true,
    imports: [MatButtonModule, CommonModule,
        RouterModule,
        FormsModule,
        PickerComponent,
        EmojiModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatMenuModule,
        MatIconModule,
        MatDialogModule, HighlightMentionsPipe],
    templateUrl: "./thread.component.html",
    styleUrls: ["./thread.component.scss"],
})
export class ThreadComponent implements OnChanges {
    @Input() channelId!: string;
    @Input() messageId!: string;
    @Input() initialMessage!: Message;
    @Output() threadClose = new EventEmitter<boolean>();
    @ViewChild("messageInput") messageInput!: ElementRef<HTMLInputElement>;
    messages: Message[] = [];
    messageText: string = "";
    isPickerVisible = false;
    pickerContext: string = "";
    currentMessagePadnumber: string = "";
    currentInputValue: string = "";
    formCtrl = new FormControl();
    filteredMembers: Observable<UsersList[]>;
    initialMessagePicker = false;
    previewUrl: string | ArrayBuffer | null = null;
    perLineCount = 9;


    constructor(
        public chatService: ChatService,
        public currentUser: CurrentuserService,
        public dialog: MatDialog,  // MatDialog injizieren
        private threadService: ThreadService,
        private imageService: ImageService,
        public commonFnService: CommonFnService
    ) {
        this.filteredMembers = this.formCtrl.valueChanges.pipe(
            startWith(""),
            map((value: string | null) => (value ? this.commonFnService._filter(value) : [])),
        );
    }


    ngOnInit() {
        if (this.channelId && this.messageId) {
            this.loadMessages();
        }
        this.chatService.openedComponent.subscribe((component) => {
            if (component === 'thread') {
                setTimeout(() => {
                    this.messageInput.nativeElement.value = '';
                    this.messageInput.nativeElement.focus();
                }, 100);
            }
        });
        this.commonFnService.loadRecentEmojis();
    }


    ngOnChanges(changes: SimpleChanges) {
        if ((changes["channelId"] && changes["channelId"].currentValue) || (changes["messageId"] && changes["messageId"].currentValue)) {
            if (this.channelId && this.messageId) {
                this.loadMessages();
            }
        }
    }


    closeThread() {
        this.threadClose.emit(false);
        this.chatService.openedComponent.next('chat');
        if (window.matchMedia("(max-width: 768px)").matches) {
            this.chatService.mobileOpen = "chat";
        }
    }


    getNumberOfAnswers() {
        if (this.messages.length > 1) {
            return this.messages.length + ' Antworten';

        } else if (this.messages.length === 1) {
            return '1 Antwort';

        } else {
            return false;
        }
    }


    loadMessages() {
        this.threadService.loadThreadMessages(this.channelId, this.messageId)
            .subscribe((messages) => {
                this.messages = messages;
            });
        this.chatService.loadChannel(this.channelId);
    }


    async send() {
        const imageUrl = await this.handleImageUpload();
        if (this.shouldSendMessage(imageUrl)) {
            await this.sendMessage(imageUrl);
            this.resetMessage();
            this.loadMessages();
        }
    }


    async handleImageUpload(): Promise<string> {
        if (this.previewUrl) {
            const fileInput = document.getElementById('fileUploadThread') as HTMLInputElement;
            const imageUrl = await this.imageService.uploadFile(fileInput);
            this.clearPreview();
            return imageUrl;
        }
        return '';
    }


    shouldSendMessage(imageUrl: string): boolean {
        return this.messageText.trim() !== "" || imageUrl.trim() !== "";
    }


    async sendMessage(imageUrl: string) {
        const message: Message = {
            id: "",
            avatar: "",
            name: "",
            time: new Date().toISOString(),
            message: this.messageText,
            createdAt: new Date(),
            reactions: {},
            padNumber: "",
            btnReactions: [],
            imageUrl: imageUrl
        };

        await this.threadService.sendThreadMessage(this.channelId, this.messageId, message);
    }


    resetMessage() {
        this.messageText = "";
        this.chatService.threadInfoMap.clear();
    }


    onKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            this.send();
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


    openDialogImage(imageUrl: string | ArrayBuffer) {
        this.dialog.open(DialogImageComponent, {
            panelClass: "image-dialog",
            data: imageUrl
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


    addAtSymbol() {
        if (this.messageText.slice(-1) !== "@") {
            this.messageText += "@";
            this.currentInputValue += "@";
        }
        this.messageInput.nativeElement.focus();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.isPickerVisible = false;
    }


    togglePicker(context: string, padNr: any, event: MouseEvent, initialMessage: boolean) {
        if (window.matchMedia("(max-width: 350px)").matches) {
            this.perLineCount = 8;
        } else {
            this.perLineCount = 9;
        }
        this.isPickerVisible = !this.isPickerVisible;
        this.pickerContext = context;
        this.currentMessagePadnumber = padNr;
        this.initialMessagePicker = initialMessage;
    }


    addEmoji(event: any) {
        if (this.pickerContext === "input") {
            this.messageText += event.emoji.native;
        } else if (this.pickerContext === "reaction") {
            this.addReactionToMessage(this.currentMessagePadnumber, event.emoji.native);
        }
        setTimeout(() => {
            this.commonFnService.loadRecentEmojis();  // Refresh recent emojis after a delay
        }, 100);
    }


    addReactionToMessage(messagePadnr: string, emoji: string) {
        if (this.initialMessagePicker) {
            this.chatService.addReaction(messagePadnr, emoji, 'chat', '')
                .catch((error) => console.error("Error adding reaction: ", error));
        } else {
            this.chatService.addReaction(this.messageId, emoji, 'thread', messagePadnr)
                .catch((error) => console.error("Error adding reaction: ", error));
        }
    }


    addOrSubReaction(message: any, reaction: any,) {
        this.chatService.addOrSubReaction(message, reaction, 'thread', this.messageId);
    }


    addOrSubReactionInitial(message: any, reaction: any) {
        this.chatService.addOrSubReaction(message, reaction, 'chat', this.messageId);
    }


    closePicker(event: Event) {
        if (this.isPickerVisible) {
            this.isPickerVisible = false;
            this.pickerContext = "";
            this.currentMessagePadnumber = "";
        }
    }


    openDialogEditMessage(threadId: string, currentMessage: string): void {
        const dialogRef = this.dialog.open(DialogEditMessageComponent, {
            panelClass: 'edit-message-dialog',
            data: { message: currentMessage }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const newContent = result;
                this.threadService.updateThreadMessage(this.channelId, this.messageId, threadId, newContent)
                    .catch(error => console.error('Error updating thread message:', error));
            }
        });
    }


    onFileSelected(event: any) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const file = input.files[0];
            if (!this.isValidFile(file)) {
                input.value = ''; // Reset input if invalid
                return;
            }
            this.loadFilePreview(file);
        }
    }


    isValidFile(file: File): boolean {
        const maxSize = 500 * 1024; // 500 KB
        const validTypes = ['image/png', 'image/jpeg'];

        if (file.size > maxSize) {
            alert('Die Datei ist zu groß. Maximal 500 KB erlaubt.');
            return false;
        }
        if (!validTypes.includes(file.type)) {
            alert('Ungültiges Dateiformat. Nur PNG und JPG sind erlaubt.');
            return false;
        }
        return true;
    }


    loadFilePreview(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            this.previewUrl = reader.result;
        };
        reader.readAsDataURL(file);
    }


    focusTextarea() {
        this.messageInput.nativeElement.focus();
    }


    clearPreview() {
        this.previewUrl = null;
    }
}
