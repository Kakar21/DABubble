import { Injectable } from "@angular/core";
import { FirestoreService } from "./firestore.service";
import { collection, doc, onSnapshot, orderBy, query, setDoc, getDocs, serverTimestamp, getDoc, updateDoc, DocumentReference } from "@angular/fire/firestore";
import { Channel } from "../interfaces/channel";
import { Message } from "../interfaces/message";
import { CurrentuserService } from "./currentuser.service";
import { UsersList } from "../interfaces/users-list";
import { ChannelsList } from "../interfaces/channels-list";
import { Observable, Subject } from "rxjs";
import { onValue, ref } from "@angular/fire/database";
import { ThreadService } from "./thread.service";

@Injectable({
    providedIn: "root",
})
export class ChatService {
    channels: Record<string, Channel> = {};
    currentChannel: Channel = {
        name: "",
        description: "",
        creator: "",
        members: [],
        messages: new Map(),
    };
    channelsList: ChannelsList[] = [];
    currentChannelID = "";
    usersList: UsersList[] = [];
    openComponent: "directMessage" | "newMessage" | "chat" | string = "";
    selectedChannel = "";
    selectedDirectmessage = "";
    mobileOpen = "";
    selectedPadnumber: string = "";
    selectedUser: UsersList = {
        id: "",
        name: "",
        avatar: "",
        email: "",
        online: false,
    };
    collectionPath = '';
    pathNr = '';
    allMessages: Record<string, Message[]> = {};
    threadInfoMap: Map<string, { count: number; lastMessageTime: string | null; }> = new Map();
    openedComponent = new Subject<string>();


    constructor(
        public firestore: FirestoreService,
        public currentUser: CurrentuserService,
        private threadService: ThreadService
    ) {
        this.loadUserList();
        this.subChannelsList();
    }


    subChannelsList() {
        let ref = this.firestore.channelsRef;
        return onSnapshot(ref, (list) => {
            this.channelsList = [];
            list.forEach((element) => {
                this.channelsList.push(
                    this.setChannelsListObj(element.data(), element.id),
                );
            });
        });
    }


    setChannelsListObj(obj: any, id: string): ChannelsList {
        return {
            id: id || "",
            channelData: obj || null,
        };
    }


    openChannel(channelId: string) {
        this.selectedChannel = channelId;
        this.selectedDirectmessage = "";

        this.loadChannel(channelId);
        if (this.isMobileDevice()) {
            this.mobileOpen = "chat";
        }
    }


    openDirectMessage(userId: string) {
        const user = this.usersList.find(user => user.id === userId);
        if (user) {
            this.selectedDirectmessage = userId;
            this.selectedChannel = "";
            this.selectedUser = user;
            if (this.isMobileDevice()) {
                this.mobileOpen = "directmessage";
            } else {
                this.openedComponent.next('directmessage');
            }
        } else {
            console.error(`User with ID ${userId} not found`);
        }
    }


    private isMobileDevice(): boolean {
        return window.matchMedia("(max-width: 768px)").matches;
    }


    loadChannel(id: string) {
        const channelRef = this.firestore.channelsRef;
        const channelDocRef = doc(channelRef, id);
        const messagesCollectionRef = collection(channelDocRef, "messages");
        const messagesQuery = query(messagesCollectionRef, orderBy("time"));

        return onSnapshot(messagesQuery, (querySnapshot) => {
            this.initializeChannel(id);
            this.processMessages(querySnapshot, id);
            this.subscribeToChannelMetadata(channelRef, id);
            this.currentChannel = this.channels[id];
            this.currentChannelID = id;
        });
    }


    private initializeChannel(id: string) {
        if (!this.channels[id]) {
            this.channels[id] = {
                name: "",
                description: "",
                creator: "",
                members: [],
                messages: new Map(),
            };
        }
    }


    private processMessages(querySnapshot: any, channelId: string) {
        const messages: Message[] = [];
        querySnapshot.forEach((doc: any) => {
            const messageData = doc.data() as Message;
            this.channels[channelId].messages?.set(doc.id, messageData);
            messages.push(messageData);
            this.loadThreadInfo(channelId, doc.id);
        });
        this.allMessages[channelId] = messages;
    }


    private subscribeToChannelMetadata(channelRef: any, id: string) {
        onSnapshot(doc(channelRef, id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.channels[id].name = data["name"];
                this.channels[id].creator = data["creator"];
                this.channels[id].members = data["members"] || [];
                this.channels[id].description = data["description"] || "";
            }
        });
    }


    loadMessages(channelId: string): Observable<Message[]> {
        const messagesRef = collection(this.firestore.firestore, `channels/${channelId}/messages`);
        const messagesQuery = query(messagesRef, orderBy("time"));

        return new Observable((observer) => {
            onSnapshot(messagesQuery, (snapshot) => {
                const messages: Message[] = [];
                snapshot.forEach((doc) => {
                    messages.push(doc.data() as Message);
                });
                observer.next(messages);
                this.allMessages[channelId] = messages;
            });
        });
    }


    observeMessage(channelId: string, messageId: string): Observable<Message | undefined> {
        const messageDocRef = doc(this.firestore.firestore, `channels/${channelId}/messages/${messageId}`);
        return new Observable((observer) => {
            return onSnapshot(messageDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    observer.next(docSnapshot.data() as Message);
                } else {
                    observer.next(undefined);
                }
            });
        });
    }


    async loadThreadInfo(channelId: string, messageId: string) {
        const threadInfo = await this.threadService.getThreadInfo(channelId, messageId);
        this.threadInfoMap.set(messageId, threadInfo);
    }


    async sendMessage(channelId: string, message: Message) {
        const channelRef = collection(this.firestore.firestore, `channels/${channelId}/messages`);
        const messageCount = await this.getMessageCount(channelRef);
        const newMessageRef = doc(channelRef, this.padNumber(messageCount, 4));
        const messageData = this.createMessageData(message);
        await setDoc(newMessageRef, messageData);
    }


    private async getMessageCount(channelRef: any): Promise<number> {
        const messagesSnapshot = await getDocs(channelRef);
        return messagesSnapshot.size;
    }


    private createMessageData(message: Message): Message {
        return {
            id: this.currentUser.currentUser.id,
            avatar: this.currentUser.currentUser.avatar,
            name: this.currentUser.currentUser.name,
            time: message.time,
            message: message.message,
            createdAt: serverTimestamp(),
            reactions: {},
            padNumber: this.selectedPadnumber,
            btnReactions: [],
            imageUrl: message.imageUrl
        };
    }


    numberOfMembers() {
        let number = [];
        for (let index = 0; index < this.currentChannel.members.length && index < 3; index++) {
            number.push(index);
        }
        return number;
    }


    padNumber(num: number, size: number) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        this.selectedPadnumber = s;
        return s;
    }


    loadUserList() {
        const usersRef = this.firestore.usersRef;
        onSnapshot(usersRef, (snapshot) => {
            const users: UsersList[] = [];
            snapshot.forEach((doc) => {
                const userData = doc.data();
                const userId = doc.id;
                const userObj = this.currentUser.setUsersListObj(userData, userId);
                users.push(userObj);
            });
            this.usersList = users;
            this.loadOnlineStatus();
        });
    }


    loadOnlineStatus() {
        this.usersList.forEach((user) => {
            this.subscribeToUserStatus(user);
        });
    }


    private subscribeToUserStatus(user: UsersList) {
        const statusRef = ref(this.firestore.db, `status/${user.id}`);
        onValue(statusRef, (snapshot) => {
            user.online = snapshot.exists() && snapshot.val().online || false;
        });
    }


    setComponent(componentName: string) {
        this.openComponent = componentName;
    }


    checkContext(context: string, chatMessagePadnr: string, currentMessagePadnr: string) {
        switch (context) {
            case 'chat':
                this.setChatContext(chatMessagePadnr);
                break;
            case 'thread':
                this.setThreadContext(chatMessagePadnr, currentMessagePadnr);
                break;
            case 'DM':
                this.setDirectMessageContext(chatMessagePadnr, currentMessagePadnr);
                break;
            default:
                console.error(`Unknown context: ${context}`);
                return;
        }
    }


    private setChatContext(chatMessagePadnr: string) {
        this.collectionPath = `channels/${this.currentChannelID}/messages`;
        this.pathNr = chatMessagePadnr;
    }


    private setThreadContext(chatMessagePadnr: string, currentMessagePadnr: string) {
        this.collectionPath = `channels/${this.currentChannelID}/messages/${chatMessagePadnr}/threads`;
        this.pathNr = currentMessagePadnr;
    }


    private setDirectMessageContext(chatMessagePadnr: string, currentMessagePadnr: string) {
        this.collectionPath = `users/${this.currentUser.currentUserUid}/${chatMessagePadnr}`;
        this.pathNr = currentMessagePadnr;
    }


    async addReaction(chatMessagePadnr: string, emoji: string, context: string, currentMessagePadnr: string) {
        this.checkContext(context, chatMessagePadnr, currentMessagePadnr);
        const messageRef = this.getMessageRef();
        const messageData = await this.getMessageData(messageRef);
        if (!messageData) {
            console.error(`Message with ID ${this.pathNr} not found`);
            return;
        }
        this.ensureReactions(messageData);
        const currentUserName = this.currentUser.currentUser.name;
        this.updateReaction(messageData, emoji, currentUserName);
        await updateDoc(messageRef, { reactions: messageData["reactions"] });
    }


    async addOrSubReaction(message: any, reaction: string, context: string, chatMessagePadnr: string) {
        this.handleContext(context, chatMessagePadnr, message);
        const messageRef = this.getMessageRef();
        const messageData = await this.getMessageData(messageRef);
        if (!messageData) {
            console.error(`Message with ID ${message.key} not found`);
            return;
        }
        const currentUser = this.currentUser.currentUser.name;
        this.updateReactionData(messageData, reaction, currentUser);
        await updateDoc(messageRef, { reactions: messageData["reactions"] });
    }


    private handleContext(context: string, chatMessagePadnr: string, message: any) {
        const padNumber = context === 'DM' ? message : message.padNumber;
        this.checkContext(context, chatMessagePadnr, padNumber);
    }


    private getMessageRef(): DocumentReference {
        const threadMessagesRef = collection(this.firestore.firestore, this.collectionPath);
        return doc(threadMessagesRef, this.pathNr);
    }


    private async getMessageData(messageRef: DocumentReference): Promise<any> {
        const messageSnapshot = await getDoc(messageRef);
        if (!messageSnapshot.exists()) {
            return null;
        }
        return messageSnapshot.data();
    }


    private ensureReactions(messageData: any) {
        if (!messageData["reactions"]) {
            messageData["reactions"] = {};
        }
    }


    private updateReaction(messageData: any, emoji: string, currentUserName: string) {
        if (!messageData["reactions"][emoji]) {
            messageData["reactions"][emoji] = {
                count: 0,
                users: []
            };
        }
        const reaction = messageData['reactions'][emoji];
        if (!reaction.users.includes(currentUserName)) {
            reaction.count++;
            reaction.users.push(currentUserName);
        }
    }


    private updateReactionData(messageData: any, reaction: string, currentUser: string) {
        if (!messageData["reactions"]) {
            messageData["reactions"] = {
                count: 0,
                users: []
            };
        }

        const reactionData = messageData["reactions"][reaction];
        const userIndex = reactionData.users.indexOf(currentUser);

        if (userIndex === -1) {
            reactionData.users.push(currentUser);
            reactionData.count++;
        } else {
            reactionData.users.splice(userIndex, 1);
            reactionData.count--;
            if (reactionData.count === 0) {
                delete messageData["reactions"][reaction];
            }
        }
    }


    emptyChannel() {
        if (this.currentChannel.messages) {
            return this.currentChannel.messages?.size === 0;
        } else {
            return false;
        }
    }


    async updateMessage(channelId: string, messageId: string, newContent: string): Promise<void> {
        const messageDocRef = doc(this.firestore.firestore, `channels/${channelId}/messages/${messageId}`) as DocumentReference;
        try {
            await updateDoc(messageDocRef, {
                message: newContent,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error updating message:", error);
        }
    }


    selectChannel(channelID: string) {
        if (!channelID) {
            console.error("Invalid channelID:", channelID);
            return;
        }
        this.selectedChannel = channelID;
        this.selectedDirectmessage = "";
        this.threadInfoMap.clear();
        this.loadChannel(channelID);
        if (this.isMobileDevice()) {
            this.mobileOpen = "chat";
        }
    }


    selectDirectMessage(userID: string) {
        if (!userID) {
            console.error("Invalid userID:", userID);
            return;
        }
        this.selectedDirectmessage = userID;
        this.selectedChannel = "";
        const user = this.usersList.find(user => user.id === userID);
        if (user) {
            this.selectedUser = user;
        } else {
            console.error("User not found for userID:", userID);
        }
        if (this.isMobileDevice()) {
            this.mobileOpen = "directmessage";
        }
    }
}