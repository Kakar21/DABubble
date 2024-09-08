import { Injectable } from "@angular/core";
import { CurrentuserService } from "../../../currentuser.service";
import { Firestore, collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, DocumentReference, getDoc } from "@angular/fire/firestore";
import { serverTimestamp } from "@angular/fire/firestore";
import { Message } from "../../../interfaces/message";
import { ChatService } from "../chat.service";

@Injectable({
    providedIn: "root",
})
export class DirectmessageService {
    sendedUserID!: string;
    messages: Record<string, Message> = {};
    allMessages: { [userId: string]: { [messageId: string]: any } } = {};

    constructor(
        public currentUser: CurrentuserService,
        private firestore: Firestore,
        private chat: ChatService,
    ) {
        console.log(this.messages)
    }

    async sendMessage(sendedUserID: string, message: Message) {
        this.sendedUserID = sendedUserID;
        const userRef = collection(
            this.firestore,
            `users/${this.currentUser.currentUser.id}/${sendedUserID}/`,
        );
        const messagesSnapshot = await getDocs(userRef);
        const messageCount = messagesSnapshot.size;
        const newMessageRef = doc(userRef, this.padNumber(messageCount, 4));

        const newMessage: Message = {
            id: this.currentUser.currentUser.id,
            avatar: this.currentUser.currentUser.avatar, // avatar: message.avatar,
            name: this.currentUser.currentUser.name,
            time: message.time,
            message: message.message,
            createdAt: serverTimestamp(),
            reactions: {},
            padNumber: "",
            btnReactions: [],
            imageUrl: message.imageUrl
        };
        try {
            await setDoc(newMessageRef, newMessage, { merge: true });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    }

    padNumber(num: number, size: number) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    getMessages(id: string) {
        const channelRef = collection(
            this.firestore,
            `users/${this.currentUser.currentUser.id}/${id}/`,
        );
        const newMessageRef = doc(channelRef);

        const messagesQuery = query(channelRef, orderBy("time"));

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

        this.chat.usersList.forEach((user) => {
            const potentialCollectionRef = collection(
                this.firestore,
                `users/${this.currentUser.currentUser.id}/${user.id}`,
            );
            const messagesQuery = query(
                potentialCollectionRef,
                orderBy("time"),
            );

            onSnapshot(messagesQuery, (messagesSnapshot) => {
                if (!messagesSnapshot.empty) {
                    if (!this.allMessages[user.id]) {
                        this.allMessages[user.id] = {};
                    }

                    messagesSnapshot.forEach((messageDoc) => {
                        const messageData = messageDoc.data() as Message;

                        this.allMessages[user.id][messageDoc.id] = {
                            ...messageData,
                            id: messageDoc.id,
                        };
                    });
                }
            });
        });
    }

    async updateMessage(sendedUserID: string, messageId: string, newContent: string): Promise<void> {
        // Pfad zur spezifischen Nachricht in der Unterkollektion
        const messageDocRef = doc(this.firestore, `users/${this.currentUser.currentUser.id}/${sendedUserID}/${messageId}`) as DocumentReference;
    
        console.log('Updating message at:', messageDocRef.path);  // Debugging: Überprüfe den Pfad
        console.log('New content:', newContent);  // Debugging: Überprüfe den neuen Inhalt
    
        try {
            await updateDoc(messageDocRef, {
                message: newContent,
                updatedAt: new Date().toISOString(),
            });
            console.log("Message updated successfully.");
        } catch (error) {
            console.error("Error updating message:", error);
        }
    }
}
