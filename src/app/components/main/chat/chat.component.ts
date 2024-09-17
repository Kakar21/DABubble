import { Component, ElementRef, EventEmitter, Output, ViewChild, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { DialogAddMemberToChnlComponent } from "../../dialogs/dialog-add-member-to-chnl/dialog-add-member-to-chnl.component";
import { MatMenuModule } from "@angular/material/menu";
import { DialogChannelInfoComponent } from "../../dialogs/dialog-channel-info/dialog-channel-info.component";
import { DialogShowChannelMemberComponent } from "../../dialogs/dialog-show-channel-member/dialog-show-channel-member.component";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { DialogEditMessageComponent } from "../../dialogs/dialog-edit-message/dialog-edit-message.component";
import { ChatService } from "../../../shared/chat.service";
import { MainComponent } from "../main.component";
import { Message } from "../../../interfaces/message";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { serverTimestamp } from "@angular/fire/firestore";
import { Channel } from "../../../interfaces/channel";
import { CurrentuserService } from "../../../shared/currentuser.service";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { Observable, map, startWith } from "rxjs";
import { UsersList } from "../../../interfaces/users-list";
import { MatInputModule } from "@angular/material/input";
import { HighlightMentionsPipe } from "../../../pipes/highlist-mentions.pipe";
import { PofileInfoCardComponent } from "../../dialogs/pofile-info-card/pofile-info-card.component";
import { EmojiModule } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { ImageService } from "../../../shared/image.service";
import { DialogImageComponent } from "../../dialogs/dialog-image/dialog-image.component";
import { CommonFnService } from "../../../shared/common-fn.service";
import { ThreadService } from "../../../shared/thread.service";

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatDialogModule,
    MatMenuModule,
    PickerComponent,
    MainComponent,
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    HighlightMentionsPipe,
    PofileInfoCardComponent,
    EmojiModule,
  ],
  templateUrl: "./chat.component.html",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements AfterViewInit, OnInit {
  @Output() threadOpen = new EventEmitter<{ channelId: string; messageId: string; }>();
  @ViewChild("chatContainer") private chatContainer!: ElementRef;
  @ViewChild("messageInput") messageInput!: ElementRef<HTMLInputElement>;
  @ViewChild("message") message!: ElementRef<HTMLInputElement>;
  messagesArrayLength: number | undefined;
  messageText: string = "";
  isPickerVisible = false;
  pickerContext: string = "";
  currentMessagePadnumber: string = "";
  formCtrl = new FormControl();
  filteredMembers: Observable<UsersList[]>;
  showUserlist = false;
  public currentChannel!: Channel;
  currentInputValue: string = "";
  previewUrl: string | ArrayBuffer | null = null;
  pickerPosition = { top: "0px", left: "0px" };
  editMessageId: string | null = null;
  perLineCount = 9;


  constructor(
    public dialog: MatDialog,
    public chatService: ChatService,
    public currentUser: CurrentuserService,
    public imageService: ImageService,
    public commonFnService: CommonFnService,
    public threadService: ThreadService
  ) {
    this.filteredMembers = this.formCtrl.valueChanges.pipe(
      startWith(""),
      map((value: string | null) => (value ? this.commonFnService._filter(value) : []))
    );
  }


  ngOnInit(): void {
    this.focusMessageInputIfChatOpen();
    this.subscribeToOpenedComponent();
    this.commonFnService.loadRecentEmojis();
  }


  focusMessageInputIfChatOpen() {
    if (this.chatService.openComponent == "chat") {
      setTimeout(() => {
        this.messageInput.nativeElement.focus();
      }, 100);
    }
  }


  subscribeToOpenedComponent() {
    this.chatService.openedComponent.subscribe((component) => {
      if (component === "chat") {
        setTimeout(() => {
          this.messageInput.nativeElement.value = "";
          this.messageInput.nativeElement.focus();
        }, 100);
      }
    });
  }


  ngAfterViewInit() {
    if (this.chatService.currentChannel.messages) {
      this.messagesArrayLength = this.chatService.currentChannel.messages.size;
      this.chatService.currentChannel.messages.forEach((_, messageId) => {
        this.chatService.loadThreadInfo(this.chatService.currentChannelID, messageId);
      });
    }
  }


  toggleThread(channelId: string, messageId: string) {
    this.threadOpen.emit({ channelId, messageId });
    if (window.matchMedia("(max-width: 768px)").matches) {
      this.chatService.mobileOpen = "thread";
    }
  }


  focusTextarea() {
    this.messageInput.nativeElement.focus();
  }


  openProfileById(userId: string) {
    const user = this.chatService.usersList.find((u) => u.id === userId);
    if (user) {
      console.log(user);
      this.dialog.open(PofileInfoCardComponent, { data: user });
    }
  }


  addEmoji(event: any) {
    if (this.pickerContext === "input") {
      this.messageText += event.emoji.native;
    } else if (this.pickerContext === "reaction") {
      this.addReactionToMessage(this.currentMessagePadnumber, event.emoji.native);
    }
    setTimeout(() => this.commonFnService.loadRecentEmojis(), 100);
  }


  addReaction(emojiId: string, messagePadnr: string) {
    let emoji = this.commonFnService.getEmojiById(emojiId) || "";
    this.addReactionToMessage(messagePadnr, emoji);
    setTimeout(() => this.commonFnService.loadRecentEmojis(), 100);
  }


  @HostListener("window:resize", ["$event"])
  onResize(event: Event) {
    this.isPickerVisible = false;
  }
  togglePicker(context: string, padNr: any, event: MouseEvent) {
    this.setPerLineCount();
    this.isPickerVisible = !this.isPickerVisible;
    this.pickerContext = context;
    this.currentMessagePadnumber = padNr;
    if (this.isPickerVisible) {
      this.pickerPosition = this.calculatePickerPosition(event);
    }
  }


  setPerLineCount() {
    this.perLineCount = window.matchMedia("(max-width: 350px)").matches ? 8 : 9;
  }


  calculatePickerPosition(event: MouseEvent): { top: string; left: string; } {
    const pickerHeight = 350;
    const pickerWidth = 300;
    const buttonWidth = 50;
    let top = Math.min(event.clientY, window.innerHeight - pickerHeight);
    let left = Math.min(event.clientX - pickerWidth - buttonWidth, window.innerWidth - pickerWidth);
    return { top: `${top}px`, left: `${left}px` };
  }


  addReactionToMessage(messagePadnr: string, emoji: string) {
    this.chatService
      .addReaction(messagePadnr, emoji, "chat", "")
      .catch((error) => console.error("Error adding reaction: ", error));
  }


  closePicker(event: Event) {
    if (this.isPickerVisible) {
      this.isPickerVisible = false;
      this.pickerContext = "";
      this.currentMessagePadnumber = "";
    }
  }


  openDialogAddMembers(event: MouseEvent): void {
    const dialogPosition = this.getDialogPosition(event);
    if (dialogPosition) {
      this.dialog.open(DialogAddMemberToChnlComponent, {
        position: dialogPosition,
        panelClass: "custom-dialog-br",
      });
    }
  }


  getDialogPosition(event: MouseEvent): any {
    let element = event.target as Element | null;
    if (element) {
      let htmlElement = element as HTMLElement;
      let rect = htmlElement.getBoundingClientRect();
      if (window.matchMedia("(max-width: 768px)").matches) {
        return { top: `${rect.bottom + window.scrollY + 10}px` };
      } else {
        return {
          top: `${rect.bottom + window.scrollY + 13.75}px`,
          right: `${window.innerWidth - rect.left - rect.width + window.scrollX}px`,
        };
      }
    }
    return null;
  }


  openDialogImage(imageUrl: string | ArrayBuffer) {
    this.dialog.open(DialogImageComponent, {
      panelClass: "image-dialog",
      data: imageUrl,
    });
  }


  openDialogChannelInfo() {
    this.dialog.open(DialogChannelInfoComponent, {
      panelClass: "custom-dialog-br",
    });
  }


  openDialogShowMembers() {
    this.dialog.open(DialogShowChannelMemberComponent, {
      panelClass: "custom-dialog-br",
    });
  }


  openDialog(event: MouseEvent): void {
    let element = event.target as Element | null;
    if (element) {
      let htmlElement = element as HTMLElement;
      let rect = htmlElement.getBoundingClientRect();
      let dialogPosition = {
        top: `${rect.bottom + window.scrollY + 13.75}px`,
        right: `${window.innerWidth - rect.left - rect.width + window.scrollX}px`,
      };
      this.dialog.open(DialogShowChannelMemberComponent, { position: dialogPosition });
    }
  }


  async send() {
    const imageUrl = await this.uploadImage();
    if (this.messageText.trim() !== "" || imageUrl.trim() !== "") {
      const message = this.createMessage(imageUrl);
      await this.chatService.sendMessage(this.chatService.currentChannelID, message);
      this.messageText = "";
      await this.scrollToBottom();
    }
  }


  async uploadImage(): Promise<string> {
    if (this.previewUrl) {
      const fileInput = document.getElementById("fileUploadChat") as HTMLInputElement;
      const imageUrl = await this.imageService.uploadFile(fileInput);
      this.clearPreview();
      return imageUrl;
    }
    return "";
  }


  createMessage(imageUrl: string): Message {
    return {
      id: "",
      avatar: this.currentUser.currentUser.avatar || "",
      name: this.currentUser.currentUser.name,
      time: new Date().toISOString(),
      message: this.messageText,
      createdAt: serverTimestamp(),
      reactions: {},
      padNumber: "",
      btnReactions: [],
      imageUrl: imageUrl,
    };
  }


  onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }


  async scrollToBottom(): Promise<void> {
    try {
      if (this.chatContainer && this.chatService.currentChannel.messages) {
        const el = this.chatContainer.nativeElement;
        if (this.chatService.currentChannel.messages.size > 0 && el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Error scrolling to bottom:", err);
    }
  }


  isLater(newTime: string, index: number): boolean {
    const prevMsg = this.chatService.currentChannel.messages?.get(this.commonFnService.padNumber(index, 4));
    if (!prevMsg) return false;
    const prevDate = new Date(prevMsg.time).setHours(0, 0, 0, 0);
    const newDate = new Date(newTime).setHours(0, 0, 0, 0);
    return newDate > prevDate;
  }


  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentInputValue = input.value;
  }


  selected(event: MatAutocompleteSelectedEvent): void {
    const userName = event.option.viewValue;
    this.formCtrl.setValue("", { emitEvent: false });
    this.messageText = this.currentInputValue + `${userName} `;
    this.currentInputValue = this.messageText;
    this.messageInput.nativeElement.focus();
  }


  addAtSymbol() {
    if (this.messageText.slice(-1) !== "@") {
      this.messageText += "@";
      this.currentInputValue += "@";
    }
    this.messageInput.nativeElement.focus();
  }


  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const file = input.files[0];
      if (this.validateFile(file)) {
        this.createPreview(file);
      } else {
        input.value = "";
      }
    }
  }


  validateFile(file: File): boolean {
    const maxSize = 500 * 1024;
    const validTypes = ["image/png", "image/jpeg"];
    if (file.size > maxSize) {
      alert("Die Datei ist zu groß. Maximal 500 KB erlaubt.");
      return false;
    }
    if (!validTypes.includes(file.type)) {
      alert("Ungültiges Dateiformat. Nur PNG und JPG sind erlaubt.");
      return false;
    }
    return true;
  }


  createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }


  clearPreview() {
    this.previewUrl = null;
  }


  openDialogEditMessage(channelId: string, messageId: string, currentMsg: string): void {
    const dialogRef = this.dialog.open(DialogEditMessageComponent, {
      panelClass: "edit-message-dialog",
      data: { message: currentMsg },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.chatService.updateMessage(channelId, messageId, result).catch((error) => console.error("Error updating message:", error));
      }
    });
  }
}