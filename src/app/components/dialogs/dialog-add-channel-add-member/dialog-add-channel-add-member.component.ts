import { CommonModule } from "@angular/common";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Component, ElementRef, EventEmitter, Inject, Input, Optional, Output, ViewChild } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatIcon } from "@angular/material/icon";
import { ChatService } from "../../../shared/chat.service";
import { UsersList } from "../../../interfaces/users-list";
import { addDoc, collection, getFirestore } from "@angular/fire/firestore";
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent, MatOption } from "@angular/material/autocomplete";
import { Observable, map, startWith } from "rxjs";
import { MatChipGrid, MatChipsModule } from "@angular/material/chips";
import { CurrentuserService } from "../../../shared/currentuser.service";

@Component({
    selector: "app-dialog-add-channel-add-member",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatDialogActions,
        MatDialogContent,
        MatRadioModule,
        MatIcon,
        MatAutocomplete,
        MatOption,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatChipsModule,
        MatChipGrid,
    ],
    templateUrl: "./dialog-add-channel-add-member.component.html",
    styleUrls: ["./dialog-add-channel-add-member.component.scss"],
})
export class DialogAddChannelAddMemberComponent {
    @Input() bottomsheetData?: {
        channelName: string;
        channelDescription: string;
    };
    @Output() closeSheet = new EventEmitter<void>();
    @ViewChild("nameInput") nameInput!: ElementRef<HTMLInputElement>;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    userCtrl = new FormControl("");
    filteredMembers: Observable<UsersList[]>;
    addedMembers: UsersList[] = [];
    selectedOption: string = "1";
    dataBase = getFirestore();
    public allOfficeUsers: UsersList[] = this.chatService.usersList;

    constructor(
        @Optional()
        @Inject(MAT_DIALOG_DATA)
        private dialogData: { channelName: string; channelDescription: string; },
        @Optional()
        public dialogRef: MatDialogRef<DialogAddChannelAddMemberComponent>,
        public dialog: MatDialog,
        public chatService: ChatService,
        private currentUser: CurrentuserService,
    ) {
        this.filteredMembers = this.userCtrl.valueChanges.pipe(
            startWith(""),
            map((value: string | null) =>
                value
                    ? this._filter(value)
                    : this.chatService.usersList
                        .filter(user => user.id !== this.currentUser.currentUser.id) // Hier filtern wir den currentUser nach der ID
            ),
        );

    }


    get data() {
        return this.bottomsheetData || this.dialogData;
    }


    public async createChannel() {
        if (!this.data) {
            throw new Error("No data provided for channel creation");
        }

        const members = this.initializeMembers();
        await this.saveChannel(members);

        this.closeSheet.emit();
        this.dialog.closeAll();
    }


    private initializeMembers(): UsersList[] {
        let members: UsersList[] = [this.currentUser.currentUser];

        if (this.selectedOption === "2") {
            this.addSelectedMembers(members);
        } else {
            this.addAllMembers(members);
        }

        return members;
    }


    private addSelectedMembers(members: UsersList[]): void {
        this.addedMembers.forEach((user) => {
            if (!members.some(member => member.id === user.id)) {
                members.push(user);
            }
        });
    }


    private addAllMembers(members: UsersList[]): void {
        this.chatService.usersList.forEach((user) => {
            if (!members.some(member => member.id === user.id)) {
                members.push(user);
            }
        });
    }


    private async saveChannel(members: UsersList[]): Promise<void> {
        const newChannel = await addDoc(collection(this.dataBase, "channels"), {
            name: this.data.channelName,
            description: this.data.channelDescription,
            creator: this.currentUser.currentUser.name,
            members: members,
        });

        this.showChannel(newChannel.id);
    }





    remove(user: UsersList): void {
        const index = this.addedMembers.indexOf(user);

        if (index >= 0) {
            this.addedMembers.splice(index, 1);
        }
    }


    selected(event: MatAutocompleteSelectedEvent): void {
        const value = (event.option.viewValue || "").trim();

        for (let user of this.chatService.usersList) {
            if (user.name === value && this.addedMembers.indexOf(user) === -1) {
                this.addedMembers.push(user);
            }
        }

        this.nameInput.nativeElement.value = "";
        this.userCtrl.setValue(null);
    }


    private _filter(value: string): UsersList[] {
        const filterValue = value.toLowerCase();

        // Filtere den currentUser nach der ID aus
        return this.chatService.usersList
            .filter(user => user.name.toLowerCase().includes(filterValue))
            .filter(user => user.id !== this.currentUser.currentUser.id); // Filter nach ID
    }


    showChannel(id: string) {
        this.chatService.openChannel(id);
        this.chatService.setComponent("chat");
        this.chatService.selectedChannel = id;
        this.chatService.selectedDirectmessage = "";
    }


    closeDialog(): void {
        if (window.matchMedia("(max-width: 768px)").matches) {
            this.closeSheet.emit();
        } else {
            this.dialogRef.close();
        }
    }
}
