import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { DialogEditProfileComponent } from "../../dialog-edit-profile/dialog-edit-profile.component";
import { FirestoreService } from "../../firestore.service";
import { DocumentData, doc, onSnapshot } from "@angular/fire/firestore";
import { UsersList } from "../../interfaces/users-list";
import { CurrentuserService } from "../../currentuser.service";
import { CommonModule, NgClass } from "@angular/common";
import { ChatService } from "../chat/chat.service";
import {
    MatBottomSheet,
    MatBottomSheetModule,
    MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { BottomsheetProfileMenuComponent } from "../../bottomsheet-profile-menu/bottomsheet-profile-menu.component";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import {
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
} from "@angular/material/autocomplete";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable, map, startWith, switchMap } from "rxjs";
import { NewMessageOption } from "../../interfaces/new-message-option";
import { MatInputModule } from "@angular/material/input";
import { DirectmessageService } from "../chat/direct-message/directmessage.service";
import { SearchResult } from "../../interfaces/search-result";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { of } from 'rxjs';
import { ChatComponent } from "../chat/chat.component";
import { SearchService } from "./search.service";

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
    formCtrl = new FormControl("");
    filteredResults: Observable<SearchResult[]>;
    @ViewChild(ChatComponent) chatComponentInstance!: ChatComponent;

    @ViewChild("searchInput")
    searchInput!: ElementRef<HTMLInputElement>;

    constructor(
        public dialog: MatDialog,
        public currentuser: CurrentuserService,
        private chatService: ChatService,
        private _bottomSheet: MatBottomSheet,
        public DMService: DirectmessageService,
        private searchService: SearchService
    ) {
        // Hier wird der SearchResult-Stream initialisiert

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

  ngOnInit() {
        this.searchService.loadAllChannels();
        this.searchService.loadAllDirectmessages();
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

    log() {
        console.log(this.searchService.allChannelMessages);
        console.log(this.searchService.allDirectMessages);
    }

    openBottomSheet(): void {
        this._bottomSheet.open(BottomsheetProfileMenuComponent);
    }

    async getAvailableMessages(): Promise<SearchResult[]> {
        const currentUserId = this.currentuser.currentUserUid;
        await this.DMService.getAllMessages(); // Aufrufen und auf das Laden der Nachrichten warten

        console.log("All direct messages:", this.DMService.allMessages);
        console.log(
            "All direct messages (stringified):",
            JSON.stringify(this.DMService.allMessages, null, 2),
        );

        const directMessages: SearchResult[] = [];

        Object.entries(this.DMService.allMessages).forEach(
            ([userId, messages]) => {
                Object.entries(messages).forEach(([messageId, message]) => {
                    directMessages.push({
                        type: "user" as const,
                        id: messageId,
                        name: message.name,
                        avatar: message.avatar,
                        message: message.message,
                        padNumber: message.padNumber,
                        userID: userId,
                    });
                });
            },
        );

        console.log("Direct messages:", directMessages);

        // Durchlaufe die Kanalliste und filtere nur die Kanäle, in denen der Benutzer Mitglied ist
        let channelMessages: SearchResult[] = [];
        this.chatService.channelsList
            .filter((channel) => {
                const isMember = channel.channelData.members.some(
                    (member) => member.id === currentUserId,
                );
                console.log(`Channel ${channel.id} is member:`, isMember);
                return isMember;
            })
            .forEach((channel) => {
                // Für jeden Kanal, in dem der Benutzer ist, extrahiere die Nachrichten
                if (channel.channelData.messages) {
                    const messages = Array.from(
                        channel.channelData.messages.values(),
                    ).map((message) => ({
                        type: "channel" as const,
                        id: message.id,
                        name: message.name,
                        avatar: message.avatar,
                        message: message.message,
                        padNumber: message.padNumber.toString(),
                        channelName: channel.channelData.name,
                        channelID: channel.id,
                    }));
                    console.log(
                        `Messages for channel ${channel.id}:`,
                        messages,
                    );
                    channelMessages = channelMessages.concat(messages); // Füge die umgewandelten Nachrichten dem Array hinzu
                }
            });

        console.log("Channel messages:", channelMessages);

        const allMessages = [...directMessages, ...channelMessages];
        console.log("All messages:", allMessages);

        return allMessages;
    }

    getChannelMessages() {
        console.log(this.chatService.channelsList);
        let availableChannelMessages: SearchResult[] = [];

        this.chatService.channelsList
            .filter((channel) =>
                channel.channelData.members.some(
                    (member) => member.id === this.currentuser.currentUser.id,
                ),
            )
            .forEach((channel) => {
                if (channel.channelData) console.log(channel.channelData);
                channel.channelData.messages?.forEach((message) => {
                    console.log("hallo");
                    availableChannelMessages.push({
                        type: "channel",
                        id: message.id,
                        name: message.name,
                        avatar: message.avatar,
                        message: message.message,
                        padNumber: message.padNumber.toString(),
                        channelName: channel.channelData.name,
                        channelID: channel.id,
                    });
                });
            });

        return availableChannelMessages;
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
        // Wenn eine Option vorhanden ist, gib die Nachricht zurück.
        // Wenn keine Option vorhanden ist, gib einen leeren String zurück.
        return option && option.message ? option.message : '';
    }
    
    getChatComponentInstance(): ChatComponent {
        // Hier müsstest du einen Weg finden, die Instanz der ChatComponent zu erhalten
        // Beispiel: falls ChatComponent ein Child von HeaderComponent ist
        return this.chatComponentInstance;
    }

    private async _filter(value: string): Promise<SearchResult[]> {
        const filterValue = value.toLowerCase();

        const allMessages = await this.getAvailableMessages();

        return allMessages.filter(option =>
            option.name.toLowerCase().includes(filterValue) ||
            option.message.toLowerCase().includes(filterValue)
        );
    }

    openSearchResult(option: SearchResult) {
        if ((option.type === 'channel') && option.channelID) {
          // Öffne den Channel
          this.chatService.openChannel(option.channelID);
          this.chatService.setComponent('chat');
        //   closeThread();
          
          // Scrolle zur Nachricht, wenn vorhanden
          setTimeout(() => {
            this.scrollToMessage(option.padNumber);
          }, 500); // Warte, bis der Chat-Inhalt geladen ist
        } else if ((option.type === 'user') && option.userID) {
          // Öffne den Direct Message Chat
          this.DMService.getMessages(option.userID);
          this.chatService.openDirectMessage(option.userID);
          this.chatService.setComponent('directMessage');
      
          // Scrolle zur Nachricht, wenn vorhanden
          setTimeout(() => {
            this.scrollToMessage(option.id);
          }, 500); // Warte, bis der Chat-Inhalt geladen ist
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
        setTimeout(() => {
            this.searchInput.nativeElement.blur();  // Explizit den Fokus entfernen
          }, 0);
      }
}
