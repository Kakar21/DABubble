import { Dialog, DialogModule, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
    MatDialog,
    MatDialogActions,
    MatDialogContent,
    MatDialogRef,
} from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { FirestoreService } from "../firestore.service";
import { UsersList } from "../interfaces/users-list";
import { User } from "../interfaces/user";
import { HeaderComponent } from "../main/header/header.component";
import { DocumentData, doc, onSnapshot } from "@angular/fire/firestore";
import { ImageService } from "../image.service";

@Component({
    selector: "app-dialog-edit-profile-edit-profile",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatDialogActions,
        MatDialogContent,
        HeaderComponent,
    ],
    templateUrl: "./dialog-edit-profile-edit-profile.component.html",
    styleUrl: "./dialog-edit-profile-edit-profile.component.scss",
})
export class DialogEditProfileEditProfileComponent {
    @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

    currentUserUid: string | null = "";
    currentUser: UsersList = {
        id: "",
        name: "",
        email: "",
        avatar: "",
        online: false,
    };
    name = "";
    email = "";
    editing = false;
    reloginError = false;
    emailError = false;
    nameError = false;

    constructor(
        public dialogRef: MatDialogRef<DialogEditProfileEditProfileComponent>,
        public dialog: MatDialog,
        private firestore: FirestoreService,
        private imageService: ImageService
    ) {
        this.firestore.currentUser$.subscribe((uid) => {
            this.currentUserUid = uid;
            this.subCurrentUser();
            // Führen Sie hier Aktionen aus, die vom aktuellen Benutzerstatus abhängen
        });
    }

    editProfile() {
        this.name = this.currentUser.name;
        this.email = this.currentUser.email;
        this.editing = true;
    }

    cancel() {
        this.editing = false;
        this.name = this.currentUser.name;
        this.email = this.currentUser.email;
    }

    save() {
        if (!this.name) {
            this.nameError = true;
        } else if (!this.email) {
            this.emailError = true;
        } else {
            this.nameError = false;
            this.emailError = false;
            this.updateUser();
        }
    }

    updateUser() {
        const oldName = this.currentUser.name;  // Speichere den alten Namen

        this.firestore
            .updateEmail(this.email)
            .then(() => {
                return this.firestore.updateUser(
                    this.name,
                    this.email,
                    this.currentUser.avatar,
                );
            })
            .then(() => {
                // Aktualisiere den Benutzer in allen Channels, in denen er Mitglied ist
                return this.firestore.updateUserInChannels({
                    id: this.currentUser.id,
                    name: this.name,
                    email: this.email,
                    avatar: this.currentUser.avatar
                });
            })
            .then(() => {
                // Aktualisiere den Namen des Benutzers als creator in den Channels
                return this.firestore.updateUserInChannelCreators(oldName, this.name);
            })
            .then(() => {
                console.log("User updated successfully");
                this.editing = false;
                this.reloginError = false;
                this.emailError = false;
            })
            .catch((error) => {
                switch (error.code) {
                    case "auth/requires-recent-login":
                        this.emailError = false;
                        this.reloginError = true;
                        break;
                    case "auth/invalid-email":
                        this.reloginError = false;
                        this.emailError = true;
                        break;
                    default:
                        console.log("An unexpected error occurred.");
                        break;
                }
            });
    }

    closeDialog() {
        this.dialogRef.close();
    }

    subCurrentUser() {
        let firestore = this.firestore.getFirestore();
        let ref;
        if (this.currentUserUid) {
            ref = doc(firestore, "users", this.currentUserUid);
            return onSnapshot(ref, (doc) => {
                this.currentUser = this.setCurrentUserObj(doc.data(), doc.id);
            });
        } else {
            return console.log("invalid user uid");
        }
    }

    setCurrentUserObj(obj: any, id: string): UsersList {
        return {
            id: id || "",
            name: obj.name || "",
            avatar: obj.avatar || "",
            email: obj.email || "",
            online: obj.online || false,
        };
    }

    onAvatarClick() {
        if (this.currentUserUid !== "mMqjWie0OWa6lWCnq5hStLQqXow1") {
            this.avatarInput.nativeElement.click();
        }
    }

    onFileSelected(event: any) {
        const input = event.target as HTMLInputElement;
        if (input && input.files && input.files.length > 0) {
            this.imageService.uploadFile(input).then((url: string) => {
                if (url) {
                    this.currentUser.avatar = url;
                    this.saveAvatarUrl(url);
                } else {
                    console.error('File upload returned an empty URL.');
                }
            }).catch((error) => {
                console.error('Error uploading file:', error);
            });
        }
    }

    saveAvatarUrl(url: string) {
        this.firestore.updateUser(
            this.currentUser.name,
            this.currentUser.email,
            url // Update the avatar URL in the user's profile
        ).then(() => {
            console.log("Avatar updated successfully");
        }).catch((error) => {
            console.error('Error updating avatar in Firestore:', error);
        });
    }
}
