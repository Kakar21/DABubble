import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ChatService } from "../shared/chat.service";

@Pipe({
    name: "highlightMentions",
    standalone: true,
})
export class HighlightMentionsPipe implements PipeTransform {


    constructor(
        private chatService: ChatService,
        private sanitizer: DomSanitizer,
    ) { }


    transform(value: string): SafeHtml {
        const mentionPattern = /@(\w+(?: \w+)?)/g;
        const formattedText = value.replace( mentionPattern, (match, username) => {
                const userExists = this.chatService.usersList.some((user) => user.name === username);
                if (userExists) {
                    return `<span class="highlight-mention" data-username="${username}">${match}</span>`;
                } else {
                    return match;
                }
            },
        );

        return this.sanitizer.bypassSecurityTrustHtml(formattedText);
    }
}
