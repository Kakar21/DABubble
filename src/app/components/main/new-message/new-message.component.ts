import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { DirectmessageService } from "../../../shared/directmessage.service";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable, map, startWith } from "rxjs";
import { ChatService } from "../../../shared/chat.service";
import { NewMessageOption } from "../../../interfaces/new-message-option";
import { MatChipsModule } from "@angular/material/chips";
import { MatInputModule } from "@angular/material/input";
import { CurrentuserService } from "../../../shared/currentuser.service";

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
    @ViewChild("nameInput") nameInput!: ElementRef<HTMLInputElement>;
    messageText: string = "";
    startsWith: string = "";
    isPickerVisible = false;
    formCtrl = new FormControl("");
    filteredOptions: Observable<NewMessageOption[]>;


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


    getAvailableOptions(): NewMessageOption[] {
        return [...this._getFilteredUsers(), ...this._getFilteredChannels()];
    }


    private _getFilteredUsers(): NewMessageOption[] {
        const currentUserId = this.currentUserService.currentUserUid;
        return this.chatService.usersList
            .filter((user) => user.id !== currentUserId)
            .map((user) => ({
                type: "user" as const,
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            }));
    }


    private _getFilteredChannels(): NewMessageOption[] {
        const currentUserId = this.currentUserService.currentUserUid;
        return this.chatService.channelsList
            .filter((channel) =>
                channel.channelData.members.some(
                    (member) => member.id === currentUserId
                )
            )
            .map((channel) => ({
                type: "channel" as const,
                id: channel.id,
                name: channel.channelData.name,
            }));
    }


    selected(event: MatAutocompleteSelectedEvent): void {
        const selectedOption = this._findSelectedOption(event.option.value.trim());

        if (selectedOption) {
            this._handleSelection(selectedOption);
        }

        this._resetInput();
    }


    private _findSelectedOption(value: string): NewMessageOption | undefined {
        return this.getAvailableOptions().find((option) => option.id === value);
    }


    private _resetInput(): void {
        this.nameInput.nativeElement.value = "";
        this.formCtrl.setValue(null);
    }


    private _handleSelection(option: NewMessageOption): void {
        if (option.type === "user") {
            this.openDirectMessage(option.id);
            this.chatService.setComponent("directMessage");
        } else if (option.type === "channel") {
            this.openChannel(option.id);
            this.chatService.setComponent("chat");
        }
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

        return filterValue.startsWith("#")
            ? this._filterByChannel(filterValue.slice(1), allOptions)
            : filterValue.startsWith("@")
                ? this._filterByUser(filterValue.slice(1), allOptions)
                : this._filterAll(filterValue, allOptions);
    }


    private _filterByChannel(value: string, options: NewMessageOption[]): NewMessageOption[] {
        return options.filter(
            (option) =>
                option.type === "channel" &&
                option.name.toLowerCase().includes(value)
        );
    }


    private _filterByUser(value: string, options: NewMessageOption[]): NewMessageOption[] {
        return options.filter(
            (option) =>
                option.type === "user" &&
                option.name.toLowerCase().includes(value)
        );
    }


    private _filterAll(filterValue: string, options: NewMessageOption[]): NewMessageOption[] {
        const filteredUsers = this._filterByUser(filterValue, options);
        const filteredChannels = this._filterByChannel(filterValue, options);
        return [...filteredUsers, ...filteredChannels];
    }
}
