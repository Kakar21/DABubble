import { Injectable, inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { CurrentuserService } from "./shared/currentuser.service";

@Injectable({
    providedIn: "root",
})
export class AuthGuard {
}

export const canActivateGuard: CanActivateFn = () => {
    if (inject(CurrentuserService).isLoggedIn) {
        return true;
    } else {
        return false;
    }
};
