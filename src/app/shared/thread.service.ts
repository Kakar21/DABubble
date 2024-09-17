import { Injectable } from "@angular/core";
import { Firestore, collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot, DocumentReference, updateDoc } from "@angular/fire/firestore";
import { Message } from "../interfaces/message";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { CurrentuserService } from "./currentuser.service";

@Injectable({
    providedIn: "root",
})
export class ThreadService {
    selectedPadnumber: string = "";



    constructor(
        private firestore: Firestore,
        private firestoreService: FirestoreService,
        private currentUser: CurrentuserService
    ) { }


    async sendThreadMessage(channelId: string, messageId: string, message: Message) {
        const threadRef = this.getThreadReference(channelId, messageId);
        const messageCount = await this.getMessageCount(threadRef);
        const newMessageRef = this.getNewMessageRef(threadRef, messageCount);
        const messageData = this.createMessageData(message);
        await setDoc(newMessageRef, messageData);
    }


    private getThreadReference(channelId: string, messageId: string) {
        return collection(this.firestoreService.firestore, `channels/${channelId}/messages/${messageId}/threads`);
    }


    private async getMessageCount(threadRef: any): Promise<number> {
        const messagesSnapshot = await getDocs(threadRef);
        return messagesSnapshot.size;
    }


    private getNewMessageRef(threadRef: any, messageCount: number) {
        return doc(threadRef, this.padNumber(messageCount, 4));
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


    padNumber(num: number, size: number) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        this.selectedPadnumber = s;
        return s;
    }


    loadThreadMessages(channelId: string, messageId: string): Observable<Message[]> {
        const threadMessagesRef = collection(this.firestoreService.firestore, `channels/${channelId}/messages/${messageId}/threads`);
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


    async updateThreadMessage(channelId: string, messageId: string, threadId: string, newContent: string): Promise<void> {
        const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/threads/${threadId}`) as DocumentReference;

        try {
            await updateDoc(messageDocRef, {
                message: newContent,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error updating thread message:", error);
        }
    }


    async getThreadInfo(channelId: string, messageId: string): Promise<{ count: number; lastMessageTime: string | null; }> {
        const threadRef = collection(this.firestore, `channels/${channelId}/messages/${messageId}/threads`);
        const threadSnapshot = await getDocs(threadRef);

        let count = 0;
        let lastMessageTime = '';

        threadSnapshot.forEach((doc) => {
            count++;
            const messageData = doc.data() as Message;
            if (!lastMessageTime || (messageData.time > lastMessageTime)) {
                lastMessageTime = messageData.time;
            }
        });

        return { count, lastMessageTime };
    }


    threadDateTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();

        if (this.isToday(date, now)) {
            return this.formatTimeToday(date);
        }

        if (this.isYesterday(date, now)) {
            return 'vor 1 Tag';
        }

        const diffInDays = this.getDifferenceInDays(date, now);

        if (diffInDays < 7) {
            return this.formatDaysAgo(diffInDays);
        } else if (diffInDays < 30) {
            return this.formatWeeksAgo(diffInDays);
        } else {
            const months = this.getDifferenceInMonths(date, now);
            if (months < 12) {
                return this.formatMonthsAgo(months);
            } else {
                return this.formatYearsAgo(months);
            }
        }
    }


    isToday(date: Date, now: Date): boolean {
        return date.toDateString() === now.toDateString();
    }


    isYesterday(date: Date, now: Date): boolean {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }


    getDifferenceInDays(date: Date, now: Date): number {
        const diffInMs = now.getTime() - date.getTime();
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    }


    formatTimeToday(date: Date): string {
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        };
        const timeString = date.toLocaleTimeString('de-DE', timeOptions);
        return `um ${timeString} Uhr`;
    }


    formatDaysAgo(days: number): string {
        return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
    }


    formatWeeksAgo(days: number): string {
        const weeks = Math.floor(days / 7);
        return `vor ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`;
    }


    getDifferenceInMonths(date: Date, now: Date): number {
        const years = now.getFullYear() - date.getFullYear();
        return now.getMonth() - date.getMonth() + years * 12;
    }


    formatMonthsAgo(months: number): string {
        return `vor ${months} ${months === 1 ? 'Monat' : 'Monaten'}`;
    }


    formatYearsAgo(months: number): string {
        const years = Math.floor(months / 12);
        return `vor ${years} ${years === 1 ? 'Jahr' : 'Jahren'}`;
    }
}
