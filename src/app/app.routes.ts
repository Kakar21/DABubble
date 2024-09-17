import { Routes } from "@angular/router";
import { MainComponent } from "./components/main/main.component";
import { LoginComponent } from "./components/start/login/login.component";
import { SignupComponent } from "./components/start/signup/signup.component";
import { RecoveryComponent } from "./components/start/recovery/recovery.component";
import { ResetPasswordComponent } from "./components/start/reset-password/reset-password.component";
import { PrivacyPolicyComponent } from "./components/start/privacy-policy/privacy-policy.component";
import { LegalNoticeComponent } from "./components/start/legal-notice/legal-notice.component";

export const routes: Routes = [
    { path: "", component: MainComponent },
    { path: "login", component: LoginComponent },
    { path: "signup", component: SignupComponent },
    { path: "recovery", component: RecoveryComponent },
    { path: "reset-password", component: ResetPasswordComponent },
    { path: "legal-notice", component: LegalNoticeComponent },
    { path: "privacy-policy", component: PrivacyPolicyComponent },
];
