import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { AvatarComponent } from "../avatar/avatar.component";
import { FormsModule, NgForm } from "@angular/forms";
import { StartComponent } from "../start.component";
import { Location } from "@angular/common";
import { FirestoreService } from "../../../shared/firestore.service";

@Component({
    selector: "app-signup",
    standalone: true,
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        AvatarComponent,
        FormsModule,
        StartComponent,
    ],
    templateUrl: "./signup.component.html",
    styleUrl: "./signup.component.scss",
})
export class SignupComponent {
    hide: any;
    forwardToAvatar = false;
    accountCreated = false;
    accountData = {
        avatar: "",
        name: "",
        email: "",
        password: "",
        privacyPolicy: false,
    };


    constructor(
        public location: Location,
        private firestore: FirestoreService,
    ) { }


    createAccount(avatar: string) {
        this.accountData.avatar = avatar;
        this.firestore
            .signUpWithEmailAndPassword(this.accountData.email, this.accountData.password)
            .then((uid) => {
                this.firestore.saveUser(this.accountData, uid);
            })
            .catch((error) => {
                console.error("Fehler bei der Erstellung des Nutzers:", error);
            });
    }


    onSubmit(ngForm: NgForm) {
        if (ngForm.submitted && ngForm.form.valid) {
            this.forwardToAvatar = true;
        }
    }
}
