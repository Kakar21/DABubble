import { Component, EventEmitter, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { SignupComponent } from "../signup/signup.component";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { ImageService } from "../../../shared/image.service"; // Importiere den ImageService

@Component({
    selector: "app-avatar",
    standalone: true,
    imports: [MatButtonModule, SignupComponent, MatButtonToggleModule],
    templateUrl: "./avatar.component.html",
    styleUrl: "./avatar.component.scss",
})
export class AvatarComponent {
    @Output() submitAvatar = new EventEmitter<string>();
    avatar = "";
    avatarPreviewUrl: string | ArrayBuffer | null = null;
    error = false;
    accountCreated = false;


    constructor(private imageService: ImageService) { }


    selectAvatar(number: string) {
        this.avatar = number;
        this.avatarPreviewUrl = null; // Entferne die Bildvorschau, wenn ein Standard-Avatar gewählt wird
    }


    async onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            // Lade die Datei hoch und erhalte die URL
            const downloadURL = await this.imageService.uploadFile(event.target);

            // Setze die Avatar-URL und zeige die Vorschau an
            this.avatarPreviewUrl = downloadURL;
            this.avatar = ""; // Entferne die Auswahl des Standard-Avatars
        }
    }


    submit() {
        if (this.avatar || this.avatarPreviewUrl) {
            this.accountCreated = true;
            setTimeout(() => {
                this.submitAvatar.emit(this.avatarPreviewUrl ? this.avatarPreviewUrl as string : this.avatar);
            }, 1500);
        } else {
            this.error = true;
        }
    }
}
