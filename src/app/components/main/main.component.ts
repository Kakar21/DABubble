import { Component, ViewChild } from "@angular/core";
import { MatDrawer } from "@angular/material/sidenav";
import { ConversationsComponent } from "./conversations/conversations.component";
import { HeaderComponent } from "./header/header.component";
import { MatSidenavModule } from "@angular/material/sidenav";
import { NgClass } from "@angular/common";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ThreadComponent } from "./thread/thread.component";
import { ChatComponent } from "./chat/chat.component";
import { WelcomeScreenComponent } from "./welcome-screen/welcome-screen.component";
import { DirectMessageComponent } from "./direct-message/direct-message.component";
import { NewMessageComponent } from "./new-message/new-message.component";
import { ChatService } from "../../shared/chat.service";
import { MatButtonModule } from "@angular/material/button";
import { ThreadService } from "../../shared/thread.service";

@Component({
    selector: "app-main",
    standalone: true,
    imports: [
        HeaderComponent,
        ConversationsComponent,
        MatSidenavModule,
        ThreadComponent,
        NgClass,
        RouterLink,
        RouterOutlet,
        ChatComponent,
        WelcomeScreenComponent,
        DirectMessageComponent,
        NewMessageComponent,
        MatButtonModule,
        NgClass,
    ],
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
})
export class MainComponent {
    @ViewChild("threadDrawer") public threadDrawer!: MatDrawer;
    threadOpen = false;
    showMenu = false;


    constructor(public chatService: ChatService, private threadService: ThreadService) { }


    mobileGoBack() {
        this.chatService.mobileOpen = "";
    }


    openMobileComponent(component: string) {
        this.chatService.mobileOpen = component;
    }


    openComponent(componentName: string) {
        this.chatService.setComponent(componentName);
    }


    openThread(event: { channelId: string; messageId: string; }) {
        this.threadService.selectedMessageId = event.messageId;
        if (!window.matchMedia("(max-width: 768px)").matches) {
            this.threadDrawer.open();
            this.threadService.openThread();
        }

        this.loadInitialMessage(event.channelId, event.messageId);
    }


    loadInitialMessage(channelId: string, messageId: string) {
        this.chatService.observeMessage(channelId, messageId).subscribe((message) => {
            if (message) {
                this.threadService.initialMessage = message;
            }
        });
    }


    closeThread() {
        if (this.threadDrawer) {
            this.threadDrawer.close();
        }
    }
}
