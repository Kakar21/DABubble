import { Component } from "@angular/core";
import { LoginComponent } from "./login/login.component";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "app-start",
    standalone: true,
    imports: [LoginComponent, CommonModule, MatButtonModule],
    templateUrl: "./start.component.html",
    styleUrl: "./start.component.scss",
})
export class StartComponent {


    constructor(public router: Router) { }
}
