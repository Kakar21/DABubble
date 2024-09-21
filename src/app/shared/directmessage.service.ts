import { Injectable } from "@angular/core";
import { CurrentuserService } from "./currentuser.service";
import { Firestore, collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, DocumentReference, getDoc } from "@angular/fire/firestore";
import { serverTimestamp } from "@angular/fire/firestore";
import { Message } from "../interfaces/message";
import { ChatService } from "./chat.service";

@Injectable({
    providedIn: "root",
})
export class DirectmessageService {
    sendedUserID!: string;
    messages: Record<string, Message> = {};
    allMessages: { [userId: string]: { [messageId: string]: any; }; } = {};
    selectedPadnumber: string = "";


    constructor(
        public currentUser: CurrentuserService,
        private firestore: Firestore,
        private chat: ChatService,
    ) { }


    async sendMessage(sendedUserID: string, message: Message) {
        const chatId = this.generateChatId(sendedUserID);
        const userRef = collection(this.firestore, `directmessages/${chatId}/messages`);
        const messageCount = await this.getMessageCount(userRef);
        const newMessageRef = doc(userRef, this.padNumber(messageCount, 4));
        const newMessage = this.createMessage(message);

        await this.saveMessage(newMessageRef, newMessage);
    }


    private async getMessageCount(userRef: any) {
        const messagesSnapshot = await getDocs(userRef);
        return messagesSnapshot.size;
    }


    private createMessage(message: Message): Message {
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


    private async saveMessage(newMessageRef: any, newMessage: Message) {
        try {
            await setDoc(newMessageRef, newMessage, { merge: true });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    }


    async addReaction(messagePadNr: string, emoji: string, userId: string) {
        const messageRef = await this.getMessageRef(messagePadNr, userId);
        const messageData = await this.getMessageData(messageRef);
        if (!messageData) return;

        await this.updateReaction(messageData, emoji, messageRef);
    }


    private async getMessageRef(messagePadNr: string, userId: string) {
        const chatId = this.generateChatId(userId);
        const messagesRef = collection(this.firestore, `directmessages/${chatId}/messages`);
        return doc(messagesRef, messagePadNr);
    }


    private async getMessageData(messageRef: DocumentReference) {
        const messageSnapshot = await getDoc(messageRef);
        if (!messageSnapshot.exists()) {
            console.error("Message not found");
            return null;
        }
        return messageSnapshot.data();
    }


    private async updateReaction(messageData: any, emoji: string, messageRef: DocumentReference) {
        const reaction = this.getOrCreateReaction(messageData, emoji);
        const currentUserName = this.currentUser.currentUser.name;

        if (!reaction.users.includes(currentUserName)) {
            reaction.count++;
            reaction.users.push(currentUserName);
            await updateDoc(messageRef, { reactions: messageData["reactions"] });
        }
    }


    private getOrCreateReaction(messageData: any, emoji: string) {
        if (!messageData["reactions"]) {
            messageData["reactions"] = {};
        }
        if (!messageData["reactions"][emoji]) {
            messageData["reactions"][emoji] = { count: 0, users: [] };
        }
        return messageData["reactions"][emoji];
    }


    async addOrSubReaction(message: Message, reaction: string, userId: string) {
        const messageRef = await this.getMessageRef(message.toString(), userId);
        const messageData = await this.getMessageData(messageRef);
        if (!messageData) return;

        await this.toggleReaction(messageData, reaction, messageRef);
    }


    private async toggleReaction(messageData: any, reaction: string, messageRef: DocumentReference) {
        const currentUserName = this.currentUser.currentUser.name;
        const reactionData = this.getOrCreateReaction(messageData, reaction);
        const userIndex = reactionData.users.indexOf(currentUserName);

        if (userIndex === -1) {
            reactionData.users.push(currentUserName);
            reactionData.count++;
        } else {
            reactionData.users.splice(userIndex, 1);
            reactionData.count--;
            if (reactionData.count === 0) {
                delete messageData["reactions"][reaction];
            }
        }

        await updateDoc(messageRef, { reactions: messageData["reactions"] });
    }


    getMessages(userId: string) {
        const chatId = this.generateChatId(userId);
        const messagesRef = collection(this.firestore, `directmessages/${chatId}/messages`);
        this.listenToMessages(messagesRef);
    }


    private listenToMessages(messagesRef: any) {
        const messagesQuery = query(messagesRef, orderBy("padNumber"));
        onSnapshot(messagesQuery, (querySnapshot) => {
            this.messages = {};
            querySnapshot.forEach((doc) => {
                const messageData = doc.data() as Message;
                this.messages[doc.id] = messageData;
            });
        });
    }


    getAllMessages() {
        this.allMessages = {};
        this.chat.usersList.forEach((user) => this.fetchMessagesForUser(user));
    }


    private fetchMessagesForUser(user: any) {
        const chatId = this.generateChatId(user.id);
        const potentialCollectionRef = collection(this.firestore, `directmessages/${chatId}/messages`);
        const messagesQuery = query(potentialCollectionRef, orderBy("time"));

        onSnapshot(messagesQuery, (messagesSnapshot) => {
            this.saveUserMessages(user, messagesSnapshot);
        });
    }


    private saveUserMessages(user: any, messagesSnapshot: any) {
        if (!messagesSnapshot.empty) {
            if (!this.allMessages[user.id]) {
                this.allMessages[user.id] = {};
            }
            messagesSnapshot.forEach((messageDoc: any) => {
                const messageData = messageDoc.data() as Message;
                this.allMessages[user.id][messageDoc.id] = { ...messageData, id: messageDoc.id };
            });
        }
    }


    async updateMessage(sendedUserID: string, messageId: string, newContent: string): Promise<void> {
        const messageDocRef = this.getMessageDocRef(sendedUserID, messageId);
        await this.updateMessageContent(messageDocRef, newContent);
    }


    private getMessageDocRef(sendedUserID: string, messageId: string) {
        const chatId = this.generateChatId(sendedUserID);
        return doc(this.firestore, `directmessages/${chatId}/messages/${messageId}`);
    }


    private async updateMessageContent(messageDocRef: DocumentReference, newContent: string) {
        try {
            await updateDoc(messageDocRef, { message: newContent, updatedAt: new Date().toISOString() });
        } catch (error) {
            console.error("Error updating message:", error);
        }
    }


    padNumber(num: number, size: number) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        this.selectedPadnumber = s;
        return s;
    }


    private generateChatId(sendedUserID: string) {
        return this.currentUser.currentUser.id < sendedUserID
            ? `${this.currentUser.currentUser.id}_${sendedUserID}`
            : `${sendedUserID}_${this.currentUser.currentUser.id}`;
    }
}
