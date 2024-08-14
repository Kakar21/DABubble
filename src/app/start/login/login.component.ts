import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { StartComponent } from "../start.component";
import { FirestoreService } from "../../firestore.service";
import { Router, RouterModule } from "@angular/router";
import { CurrentuserService } from "../../currentuser.service";

@Component({
    selector: "app-login",
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        MatButtonModule,
        StartComponent,
        RouterModule,
    ],
    templateUrl: "./login.component.html",
    styleUrl: "./login.component.scss",
})
export class LoginComponent {
    email = "";
    password = "";
    invalidEmail = false;
    invalidPasswordOrEmail = false;

    constructor(
        private firestore: FirestoreService,
        public router: Router,
    ) {}

    // Google Anmeldung
    async loginWithGoogle() {
        return this.firestore.loginWithGoogle();
    }

    async loginWithEmailAndPassword() {
        this.firestore
            .loginWithEmailAndPassword(this.email, this.password)
            .then((errorCode) => {
                this.invalidEmail = false;
                this.invalidPasswordOrEmail = false;
                if (errorCode) {
                    if (errorCode === "auth/invalid-email") {
                        this.invalidEmail = true;
                    } else {
                        this.invalidPasswordOrEmail = true;
                    }
                } else {
                    console.log("Anmeldung erfolgreich");
                    // Navigation oder weitere Aktionen
                }
            });
    }

    loginAsGuest() {
        this.firestore
            .loginAsGuest()
            .then(() => {
                console.log("Gast-Anmeldung erfolgreich");
                this.router.navigate(["/"]);
            })
            .catch((error) => {
                console.error("Fehler bei der Gast-Anmeldung", error);
            });
    }
}
