import { Component } from "@angular/core";
import { StartComponent } from "../start.component";
import { Location } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "app-legal-notice",
    standalone: true,
    imports: [StartComponent, MatButtonModule],
    templateUrl: "./legal-notice.component.html",
    styleUrl: "./legal-notice.component.scss",
})
export class LegalNoticeComponent {

    
    constructor(public location: Location) { }
}
