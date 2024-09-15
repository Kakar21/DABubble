import { CommonModule } from "@angular/common";
import {
    Component,
    ElementRef,
    EventEmitter,
    OnInit,
    Output,
    ViewChild,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { DirectmessageService } from "../chat/direct-message/directmessage.service";
import {
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
} from "@angular/material/autocomplete";
import { getFirestore } from "@angular/fire/firestore";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable, map, startWith } from "rxjs";
import { ChatService } from "../chat/chat.service";
import { NewMessageOption } from "../../interfaces/new-message-option";
import { MatChipGrid, MatChipsModule } from "@angular/material/chips";
import { MatInputModule } from "@angular/material/input";
import { CurrentuserService } from "../../currentuser.service";
import { UsersList } from "../../interfaces/users-list";

@Component({
    selector: "app-new-message",
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatButtonToggleModule,
        FormsModule,
        PickerComponent,
        MatMenuModule,
        CommonModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatChipsModule,
        MatInputModule,
    ],
    templateUrl: "./new-message.component.html",
    styleUrl: "./new-message.component.scss",
})
export class NewMessageComponent implements OnInit {
    messageText: string = "";
    startsWith: string = "";
    isPickerVisible = false;
    formCtrl = new FormControl("");
    filteredOptions: Observable<NewMessageOption[]>;
    // fruits: string[] = ['Lemon'];
    // allFruits: string[] = ['Apple', 'Lemon', 'Lime', 'Orange', 'Strawberry'];

    @ViewChild("nameInput")
    nameInput!: ElementRef<HTMLInputElement>;

    constructor(
        public DMSerivce: DirectmessageService,
        public chatService: ChatService,
        private currentUserService: CurrentuserService,
    ) {
        this.filteredOptions = this.formCtrl.valueChanges.pipe(
            startWith(""),
            map((value: string | null) =>
                value ? this._filter(value) : this.getAvailableOptions(),
            ),
        );
    }

    ngOnInit(): void {
        if (this.chatService.openComponent == 'newMessage') {
            setTimeout(() => {
              this.nameInput.nativeElement.focus();
            }, 100);
          }
    }

    togglePicker() {
        this.isPickerVisible = !this.isPickerVisible;
    }

    addEmoji(event: any) {
        console.log(event.emoji);
    }

    objectKeys(obj: any): string[] {
        return Object.keys(obj);
    }

    getAvailableOptions(): NewMessageOption[] {
        const currentUserId = this.currentUserService.currentUserUid;

        // Entfernen Sie den aktuellen Benutzer aus der Benutzerliste
        const users = this.chatService.usersList
            .filter((user) => user.id !== currentUserId)
            .map((user) => ({
                type: "user" as const,
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            }));

        // Filtern Sie Kanäle, in denen der aktuelle Benutzer Mitglied ist
        const channels = this.chatService.channelsList
            .filter((channel) =>
                channel.channelData.members.some(
                    (member) => member.id === currentUserId,
                ),
            )
            .map((channel) => ({
                type: "channel" as const,
                id: channel.id,
                name: channel.channelData.name,
            }));

        // Kombinieren Sie Benutzer und Kanäle in einem Array
        return [...users, ...channels];
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        const value = (event.option.value || "").trim();
        const selectedOption = this.getAvailableOptions().find(
            (option) => option.id === value,
        );

        if (selectedOption) {
            if (selectedOption.type === "user") {
                this.openDirectMessage(selectedOption.id);
                this.chatService.setComponent("directMessage");
            } else if (selectedOption.type === "channel") {
                this.openChannel(selectedOption.id);
                this.chatService.setComponent("chat");
            }
        }

        this.nameInput.nativeElement.value = "";
        this.formCtrl.setValue(null);
    }

    openChannel(channelId: string) {
        this.chatService.selectedChannel = channelId;
        this.chatService.selectedDirectmessage = "";
        this.chatService.openChannel(channelId);
        if (window.matchMedia("(max-width: 768px)").matches) {
            this.chatService.mobileOpen = "chat";
        }
    }

    openDirectMessage(userId: string) {
        const selectedUser = this.chatService.usersList.find(
            (user) => user.id === userId,
        );
        this.chatService.selectedDirectmessage = userId;
        this.chatService.selectedChannel = "";

        if (selectedUser) {
            this.chatService.selectedUser = selectedUser;
        }

        if (window.matchMedia("(max-width: 768px)").matches) {
            this.chatService.mobileOpen = "directmessage";
        }
    }

    private _filter(value: string): NewMessageOption[] {
        const filterValue = value.toLowerCase();

        const allOptions = this.getAvailableOptions();

        if (filterValue.startsWith("#")) {
            return allOptions.filter(
                (option) =>
                    option.type === "channel" &&
                    option.name.toLowerCase().includes(filterValue.slice(1)),
            );
        } else if (filterValue.startsWith("@")) {
            return allOptions.filter(
                (option) =>
                    option.type === "user" &&
                    option.name.toLowerCase().includes(filterValue.slice(1)),
            );
        } else {
            const filteredUsers = allOptions.filter(
                (option) =>
                    option.type === "user" &&
                    (option.name.toLowerCase().includes(filterValue) ||
                        (option.email &&
                            option.email
                                .toLowerCase()
                                .startsWith(filterValue))),
            );

            const filteredChannels = allOptions.filter(
                (option) =>
                    option.type === "channel" &&
                    option.name.toLowerCase().includes(filterValue),
            );

            return [...filteredUsers, ...filteredChannels];
        }
    }
}
