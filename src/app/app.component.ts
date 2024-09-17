import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { trigger, style, animate, transition } from "@angular/animations";
import { FirestoreService } from "./shared/firestore.service";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
    animations: [trigger, transition, animate, style],
})
export class AppComponent {
    title = "DABubble";

    constructor(private firestore: FirestoreService) {
        this.firestore.currentUser$.subscribe();
    }
}
