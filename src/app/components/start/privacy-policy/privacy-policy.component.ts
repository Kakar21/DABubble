import { Component } from "@angular/core";
import { StartComponent } from "../start.component";
import { Location } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "app-privacy-policy",
    standalone: true,
    imports: [StartComponent, MatButtonModule],
    templateUrl: "./privacy-policy.component.html",
    styleUrl: "./privacy-policy.component.scss",
})
export class PrivacyPolicyComponent {


    constructor(public location: Location) { }
}
