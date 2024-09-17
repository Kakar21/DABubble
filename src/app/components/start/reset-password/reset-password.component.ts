import { Component } from "@angular/core";
import { ReactiveFormsModule, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { FirestoreService } from "../../../shared/firestore.service";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { StartComponent } from "../start.component";

@Component({
    selector: "app-reset-password",
    standalone: true,
    imports: [
        CommonModule,
        StartComponent,
        MatButtonModule,
        ReactiveFormsModule,
    ],
    templateUrl: "./reset-password.component.html",
    styleUrls: ["./reset-password.component.scss"],
})
export class ResetPasswordComponent {
    resetPasswordForm: FormGroup;
    oobCode: string;


    constructor(
        private route: ActivatedRoute,
        private firestoreService: FirestoreService,
        private router: Router,
    ) {
        this.oobCode = this.route.snapshot.queryParams["oobCode"];
        this.resetPasswordForm = new FormGroup({
            newPassword: new FormControl("", [
                Validators.required,
                Validators.pattern("^[^\\s]{6,}$"), // Aktualisierte Regex für das Pattern
            ]),
            confirmNewPassword: new FormControl("", [Validators.required])
        },
            { validators: this.passwordMatchValidator() },
        );
    }


    changePassword() {
        if (this.resetPasswordForm.invalid) {
            alert("Bitte überprüfen Sie Ihre Eingaben.");
            return;
        }
        const newPassword = this.resetPasswordForm.get("newPassword")?.value;
        this.firestoreService.confirmPasswordReset(this.oobCode, newPassword)
            .then(() => {
                alert("Passwort erfolgreich geändert.");
                this.router.navigate(["/login"]);
            })
            .catch((error) => {
                alert("Fehler beim Ändern des Passworts: " + error.message);
            });
    }


    passwordMatchValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const newPassword = control.get("newPassword");
            const confirmNewPassword = control.get("confirmNewPassword");
            return newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value
                ? { mismatch: true }
                : null;
        };
    }


    goBack() {
        this.router.navigate(["/login"]);
    }
}
