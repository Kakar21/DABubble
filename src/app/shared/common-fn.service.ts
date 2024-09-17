import { Injectable } from '@angular/core';
import { EmojiService } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { UsersList } from '../interfaces/users-list';
import { ChatService } from './chat.service';
import { Message } from '../interfaces/message';
import { PofileInfoCardComponent } from '../components/dialogs/pofile-info-card/pofile-info-card.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class CommonFnService {
  recentEmojis: string[] = [];


  constructor(
    private emojiService: EmojiService,
    private chatService: ChatService,
    private dialog: MatDialog
  ) { }


  onMessageClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("highlight-mention")) {
      const username = target.getAttribute("data-username");
      if (username) {
        this.openProfileCard(username);
      } else {
        console.error("Kein Benutzername definiert für dieses Element");
      }
    }
  }


  openProfileCard(username: string) {
    const user = this.chatService.usersList.find(
      (u) => u.name === username,
    );
    if (user) {
      this.dialog.open(PofileInfoCardComponent, {
        data: user,
      });
    }
  }


  openProfileCardByUser(user: UsersList) {
    user.online = this.isOnline(user.id);
    this.dialog.open(PofileInfoCardComponent, {
      data: user,
    });
  }

  
  isOnline(userId: string): boolean {
    const user = this.chatService.usersList.find(
      (user) => user.id === userId,
    );
    return user ? user.online : false;
  }


  noReactions(message: Message): boolean {
    return !message.reactions || Object.keys(message.reactions).length === 0;
  }


  padNumber(num: number, size: number) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }


  dayTime(timestamp: string): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return date.toLocaleTimeString("de-DE", options);
  }


  dayDate(timestamp: string): string {
    const date = new Date(timestamp);
    if (this.isToday(date)) return "Heute";
    if (this.isYesterday(date)) return "Gestern";
    return this.formatDate(date);
  }


  private isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.setHours(0, 0, 0, 0) === today.getTime();
  }


  private isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return date.setHours(0, 0, 0, 0) === yesterday.getTime();
  }


  private formatDate(date: Date): string {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }


  _filter(value: string): UsersList[] {
    if (this.mentionUser(value)) {
      const filterValue = value
        .slice(value.lastIndexOf("@") + 1)
        .toLowerCase();
      return this.chatService.usersList.filter((user) =>
        user.name.toLowerCase().includes(filterValue),
      );
    } else {
      return [];
    }
  }


  mentionUser(value: string): boolean {
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) return false;
    const charAfterAt = value.charAt(atIndex + 1);
    return charAfterAt !== " ";
  }


  getEmojiById(emojiId: string) {
    const emoji = this.emojiService.getData(emojiId); // Get the emoji by ID
    return emoji ? emoji.native : null;           // Return the native emoji
  }


  loadRecentEmojis() {
    const recentEmojiData = localStorage.getItem('emoji-mart.frequently');
    if (recentEmojiData) {
      const recentEmojiObj = JSON.parse(recentEmojiData);
      this.recentEmojis = Object.keys(recentEmojiObj).slice(-2).reverse();  // Get the last two emojis and reverse the order
    }
  }
}
