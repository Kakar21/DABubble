import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent, MatOption } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { map, startWith } from "rxjs/operators";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Observable } from "rxjs";
import { ChatService } from "../../../shared/chat.service";
import { UsersList } from "../../../interfaces/users-list";
import { MatChipGrid, MatChipsModule } from "@angular/material/chips";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { DialogChannelInfoComponent } from "../dialog-channel-info/dialog-channel-info.component";
import { doc, getFirestore, updateDoc } from "@angular/fire/firestore";

@Component({
    selector: "app-dialog-add-member-to-chnl",
    standalone: true,
    imports: [
        MatDialogContent,
        MatButtonModule,
        FormsModule,
        CommonModule,
        MatInputModule,
        MatDialogActions,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatChipGrid,
        MatChipsModule,
        MatOption,
        MatIcon,
        MatIconModule,
        MatAutocomplete,
    ],
    templateUrl: "./dialog-add-member-to-chnl.component.html",
    styleUrls: ["./dialog-add-member-to-chnl.component.scss"], // Achtung: 'styleUrl' zu 'styleUrls' geändert und als Array definiert
})
export class DialogAddMemberToChnlComponent {
    @ViewChild("nameInput") nameInput!: ElementRef<HTMLInputElement>;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    userCtrl = new FormControl("");
    filteredMembers: Observable<UsersList[]>;
    addedMembers: UsersList[] = [];
    dataBase = getFirestore();


    constructor(
        public dialogRef: MatDialogRef<DialogChannelInfoComponent>,
        public chatService: ChatService,
    ) {
        this.filteredMembers = this.userCtrl.valueChanges.pipe(
            startWith(""),
            map((value: string | null) =>
                value ? this._filter(value) : this.getAvailableUsers()),
        );
    }


    public async addSelectedUsers() {
        const members = this.chatService.currentChannel.members;

        for (let index = 0; index < this.addedMembers.length; index++) {
            const element = this.addedMembers[index];
            members.push(element);
        }

        await updateDoc(
            doc(this.dataBase, "channels", `${this.chatService.currentChannelID}`),
            { members: members },
        );

        this.closeDialog();
    }


    getAvailableUsers(): UsersList[] {
        // Erstellen Sie ein Set mit den IDs der aktuellen Mitglieder für eine effiziente Überprüfung
        const memberIds = new Set(
            this.chatService.currentChannel.members.map((member) => member.id),
        );

        // Filtern Sie die gesamte Benutzerliste, um nur die Benutzer zu erhalten, die nicht Mitglieder sind
        return this.chatService.usersList.filter(
            (user) => !memberIds.has(user.id),
        );
    }


    remove(user: UsersList): void {
        const index = this.addedMembers.indexOf(user);

        if (index >= 0) {
            this.addedMembers.splice(index, 1);
        }
    }


    selected(event: MatAutocompleteSelectedEvent): void {
        const value = (event.option.value || "").trim();

        // Add our member
        for (let user of this.getAvailableUsers()) {
            if (user.id === value && this.addedMembers.indexOf(user) === -1) {
                this.addedMembers.push(user);
            }
        }

        this.nameInput.nativeElement.value = "";
        this.userCtrl.setValue(null);
    }


    private _filter(value: string): UsersList[] {
        const filterValue = value.toLowerCase();

        return this.getAvailableUsers().filter((user) =>
            user.name.toLowerCase().includes(filterValue),
        );
    }


    closeDialog(): void {
        this.dialogRef.close();
    }
}
