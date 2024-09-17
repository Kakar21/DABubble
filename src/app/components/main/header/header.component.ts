import { Component, ElementRef, EventEmitter, Output, ViewChild } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { DialogEditProfileComponent } from "../../dialogs/dialog-edit-profile/dialog-edit-profile.component";
import { UsersList } from "../../../interfaces/users-list";
import { CurrentuserService } from "../../../shared/currentuser.service";
import { CommonModule, NgClass } from "@angular/common";
import { ChatService } from "../../../shared/chat.service";
import { MatBottomSheet, MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { BottomsheetProfileMenuComponent } from "../../dialogs/bottomsheet-profile-menu/bottomsheet-profile-menu.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable, switchMap } from "rxjs";
import { MatInputModule } from "@angular/material/input";
import { DirectmessageService } from "../../../shared/directmessage.service";
import { SearchResult } from "../../../interfaces/search-result";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { of } from 'rxjs';
import { SearchService } from "../../../shared/search.service";
import { Message } from "../../../interfaces/message";

@Component({
    selector: "app-header",
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatExpansionModule,
        MatDialogModule,
        DialogEditProfileComponent,
        NgClass,
        MatBottomSheetModule,
        MatFormFieldModule,
        FormsModule,
        CommonModule,
        MatAutocompleteModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
    templateUrl: "./header.component.html",
    styleUrl: "./header.component.scss",
})
export class HeaderComponent {
    @ViewChild("searchInput") searchInput!: ElementRef<HTMLInputElement>;
    @Output() threadClose = new EventEmitter<boolean>();
    formCtrl = new FormControl("");
    filteredResults: Observable<SearchResult[]>;


    constructor(
        public dialog: MatDialog,
        public currentuser: CurrentuserService,
        private chatService: ChatService,
        private _bottomSheet: MatBottomSheet,
        public DMService: DirectmessageService,
        private searchService: SearchService
    ) {
        this.filteredResults = this.formCtrl.valueChanges.pipe(
            debounceTime(300),  // Vermeidet sofortige Sucheingaben zu verarbeiten
            distinctUntilChanged(),  // Ignoriert gleiche Eingaben hintereinander
            switchMap((query) => {
                if (typeof query === 'string' && query.trim() !== '') {
                    return of(searchService.searchMessagesAndChannels(query));
                } else {
                    return of([]);
                }
            })
        );
    }


    openDialog(event: MouseEvent): void {
        // Sicherstellen, dass event.target tatsächlich ein Element ist.
        let element = event.target as Element | null;

        if (element) {
            // Casten zu HTMLElement, um Zugriff auf getBoundingClientRect zu gewährleisten.
            let htmlElement = element as HTMLElement;
            let boundingClientRect = htmlElement.getBoundingClientRect();

            // Berechnung der Position, um den Dialog unterhalb des Pfeils zu positionieren.
            let dialogPosition = {
                top: `${boundingClientRect.bottom + window.scrollY + 31}px`, // Plus window.scrollY für absolute Positionierung auf der Seite
                right: `${window.innerWidth - boundingClientRect.left - boundingClientRect.width + window.scrollX}px`,
            };

            this.dialog.open(DialogEditProfileComponent, {
                position: dialogPosition,
            });
        }
    }


    isMobileOpen(string: string) {
        return this.chatService.mobileOpen === string;
    }


    mobileGoBack() {
        this.chatService.mobileOpen = "";
        this.chatService.selectedChannel = "";
        this.chatService.selectedDirectmessage = "";
    }


    mobileMenu() {
        if (window.matchMedia("(max-width: 768px)").matches) {
            this.openBottomSheet();
        }
    }


    loadSearch() {
        this.searchService.loadAllChannels();
        this.searchService.loadAllDirectmessages();
    }


    openBottomSheet(): void {
        this._bottomSheet.open(BottomsheetProfileMenuComponent);
    }


    async getAvailableMessages(): Promise<SearchResult[]> {
        const directMessages = await this.getDirectMessages();
        const channelMessages = this.getChannelMessages();
        return [...directMessages, ...channelMessages];
    }


    async getDirectMessages(): Promise<SearchResult[]> {
        await this.DMService.getAllMessages();
        const directMessages: SearchResult[] = [];
        Object.entries(this.DMService.allMessages).forEach(([userId, messages]) => {
            this.addDirectMessages(userId, messages, directMessages);
        });
        return directMessages;
    }


    addDirectMessages(userId: string, messages: Record<string, Message>, messageArray: SearchResult[]) {
        Object.entries(messages).forEach(([messageId, message]) => {
            messageArray.push({
                type: 'user',
                id: messageId,
                name: message.name,
                avatar: message.avatar,
                message: message.message,
                padNumber: message.padNumber.toString(),
                userID: userId,
            });
        });
    }


    getChannelMessages() {
        const availableChannelMessages: SearchResult[] = [];
        this.chatService.channelsList
            .filter(channel => this.isUserMemberOfChannel(channel))
            .forEach(channel => {
                this.addChannelMessages(channel, availableChannelMessages);
            });
        return availableChannelMessages;
    }


    isUserMemberOfChannel(channel: any): boolean {
        return channel.channelData.members.some((member: UsersList) => member.id === this.currentuser.currentUser.id);
    }


    addChannelMessages(channel: any, messageArray: SearchResult[]) {
        if (channel.channelData?.messages) {
            channel.channelData.messages.forEach((message: Message) => {
                messageArray.push(this.createChannelMessageObject(channel, message));
            });
        }
    }


    createChannelMessageObject(channel: any, message: any): SearchResult {
        return {
            type: 'channel',
            id: message.id,
            name: message.name,
            avatar: message.avatar,
            message: message.message,
            padNumber: message.padNumber.toString(),
            channelName: channel.channelData.name,
            channelID: channel.id
        };
    }


    selected(event: MatAutocompleteSelectedEvent): void {
        const selectedOption = event.option.value;

        if (selectedOption) {
            if (selectedOption.type === 'user' && selectedOption.userID) {
                this.chatService.selectDirectMessage(selectedOption.userID);
            } else if (selectedOption.type === 'channel' && selectedOption.channelID) {
                this.chatService.selectChannel(selectedOption.channelID);
            }
        }

        // Leere das Eingabefeld und setze den FormControl-Wert zurück
        this.searchInput.nativeElement.value = '';
        this.formCtrl.setValue(''); // Setzt das Eingabefeld auf leer zurück
    }


    displayOption(option: SearchResult): string {
        return option && option.message ? option.message : '';
    }


    openSearchResult(option: SearchResult) {
        if (option.type === 'channel' && option.channelID) {
            this.openChannelSearchResult(option);
        } else if (option.type === 'user' && option.userID) {
            this.openDirectMessageSearchResult(option);
        }
    }


    openChannelSearchResult(option: SearchResult) {
        if (option.channelID) {
            this.chatService.openChannel(option.channelID);
            this.chatService.setComponent('chat');
            this.threadClose.emit(false);
            setTimeout(() => {
                if (option.padNumber) this.scrollToMessage(option.padNumber);
            }, 500);
        }
    }


    openDirectMessageSearchResult(option: SearchResult) {
        if (option.userID) {
            this.DMService.getMessages(option.userID);
            this.chatService.openDirectMessage(option.userID);
            this.chatService.setComponent('directMessage');
            setTimeout(() => {
                if (option.id) this.scrollToMessage(option.id);
            }, 500);
        }
    }


    scrollToMessage(messageId: string) {
        const messageElement = document.getElementById(messageId);

        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            messageElement.classList.add('highlight-message');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 2000); // Zeitdauer der Animation
        } else {
            console.error('Message element not found');
        }
    }


    onOptionSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedOption = event.option.value;

        if (selectedOption) {
            if (selectedOption.type === 'user') {
                this.openSearchResult(selectedOption);
            } else if (selectedOption.type === 'channel') {
                this.openSearchResult(selectedOption);
            }
        }

        // Leere das Eingabefeld nach der Auswahl der Option
        this.formCtrl.setValue('');
        this.searchInput.nativeElement.blur();  // Explizit den Fokus entfernen
    }
}
