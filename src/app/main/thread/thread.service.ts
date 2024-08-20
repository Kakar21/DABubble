import { Injectable } from "@angular/core";
import {
    Firestore,
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot,
    DocumentReference,
    updateDoc,
} from "@angular/fire/firestore";
import { Message } from "../../interfaces/message";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class ThreadService {
    constructor(private firestore: Firestore) { }

    async sendThreadMessage(
        channelId: string,
        messageId: string,
        message: Message,
    ) {
        const threadRef = collection(
            this.firestore,
            `channels/${channelId}/messages/${messageId}/threads`,
        );
        const messagesSnapshot = await getDocs(threadRef);
        const messageCount = messagesSnapshot.size;
        const newMessageRef = doc(threadRef, this.padNumber(messageCount, 4));

        const messageData: Message = {
            id: message.id,
            avatar: message.avatar,
            name: message.name,
            time: message.time,
            message: message.message,
            createdAt: serverTimestamp(),
            reactions: message.reactions,
            padNumber: "",
            btnReactions: [],
            imageUrl: ''
        };
        await setDoc(newMessageRef, messageData);
    }

    loadThreadMessages(
        channelId: string,
        messageId: string,
    ): Observable<Message[]> {
        const threadMessagesRef = collection(
            this.firestore,
            `channels/${channelId}/messages/${messageId}/threads`,
        );
        const threadMessagesQuery = query(threadMessagesRef, orderBy("time"));

        return new Observable((observer) => {
            onSnapshot(threadMessagesQuery, (snapshot) => {
                const messages: Message[] = [];
                snapshot.forEach((doc) => {
                    messages.push(doc.data() as Message);
                });
                observer.next(messages);
            });
        });
    }

    private padNumber(num: number, size: number): string {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    async updateThreadMessage(channelId: string, messageId: string, threadId: string, newContent: string): Promise<void> {
        const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/threads/${threadId}`) as DocumentReference;
    
        try {
            await updateDoc(messageDocRef, {
                message: newContent,
                updatedAt: new Date().toISOString(),
            });
            console.log("Thread message updated successfully.");
        } catch (error) {
            console.error("Error updating thread message:", error);
        }
    }
}
