import { Injectable } from "@angular/core";
import { CurrentuserService } from "../../../currentuser.service";
import { Firestore, collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, DocumentReference, getDoc, where } from "@angular/fire/firestore";
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
    selectedPadnumber: string = "";

    constructor(
        public currentUser: CurrentuserService,
        private firestore: Firestore,
        private chat: ChatService,
    ) {}

    async sendMessage(sendedUserID: string, message: Message) {
        const chatId = this.currentUser.currentUser.id < sendedUserID 
            ? `${this.currentUser.currentUser.id}_${sendedUserID}` 
            : `${sendedUserID}_${this.currentUser.currentUser.id}`;
    
        const userRef = collection(
            this.firestore,
            `directmessages/${chatId}/messages`
        );
    
        const messagesSnapshot = await getDocs(userRef);
        const messageCount = messagesSnapshot.size;
        const newMessageRef = doc(userRef, this.padNumber(messageCount, 4));
    
        const newMessage: Message = {
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
    
        try {
            await setDoc(newMessageRef, newMessage, { merge: true });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    }

    async addReaction(messagePadNr: string, emoji: string, userId: string) {
        // Eindeutigen Chat-Pfad erstellen
        const chatId = this.currentUser.currentUser.id < userId 
            ? `${this.currentUser.currentUser.id}_${userId}` 
            : `${userId}_${this.currentUser.currentUser.id}`;

        const messagesRef = collection(
            this.firestore,
            `directmessages/${chatId}/messages`
        );

        const messageRef = doc(messagesRef, messagePadNr);
        const messageSnapshot = await getDoc(messageRef);

        if (!messageSnapshot.exists()) {
            console.error(`Message with ID ${messagePadNr} not found`);
            return;
        }

        const messageData = messageSnapshot.data();
        if (!messageData["reactions"]) {
            messageData["reactions"] = {};
        }

        if (!messageData["reactions"][emoji]) {
            messageData["reactions"][emoji] = {
                count: 0,
                users: []
            };
        }

        const reaction = messageData["reactions"][emoji];
        const currentUserName = this.currentUser.currentUser.name;

        if (!reaction.users.includes(currentUserName)) {
            messageData["reactions"][emoji].count++;
            messageData["reactions"][emoji].users.push(currentUserName);
            await updateDoc(messageRef, { reactions: messageData["reactions"] });
        }
    }
    
    async addOrSubReaction(message: Message, reaction: string, userId: string) {
        const chatId = this.currentUser.currentUser.id < userId 
            ? `${this.currentUser.currentUser.id}_${userId}` 
            : `${userId}_${this.currentUser.currentUser.id}`;

        const messagesRef = collection(
            this.firestore,
            `directmessages/${chatId}/messages`
        );

        const messageRef = doc(messagesRef, message.toString());
        const messageSnapshot = await getDoc(messageRef);

        if (!messageSnapshot.exists()) {
            console.error(`Message with ID ${message.padNumber} not found`);
            return;
        }

        const messageData = messageSnapshot.data();
        const currentUserName = this.currentUser.currentUser.name;

        if (!messageData["reactions"]) {
            messageData["reactions"] = {
                [reaction]: { count: 0, users: [] }
            };
        }

        const reactionData = messageData["reactions"][reaction] || { count: 0, users: [] };
        const userIndex = reactionData.users.indexOf(currentUserName);

        if (userIndex === -1) {
            // Reaktion hinzufügen
            reactionData.users.push(currentUserName);
            reactionData.count++;
        } else {
            // Reaktion entfernen
            reactionData.users.splice(userIndex, 1);
            reactionData.count--;

            if (reactionData.count === 0) {
                delete messageData["reactions"][reaction];
            }
        }

        await updateDoc(messageRef, { reactions: messageData["reactions"] });
    }

    padNumber(num: number, size: number) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        this.selectedPadnumber = s;
        return s;
    }

    getMessages(userId: string) {
        // Erstelle einen eindeutigen Pfad basierend auf beiden Benutzer-IDs
        const chatId = this.currentUser.currentUser.id < userId 
            ? `${this.currentUser.currentUser.id}_${userId}` 
            : `${userId}_${this.currentUser.currentUser.id}`;
    
        const messagesRef = collection(
            this.firestore,
            `directmessages/${chatId}/messages`
        );
    
        // Abfrage für Nachrichten, nur sortiert nach 'padNumber'
        const messagesQuery = query(
            messagesRef,
            orderBy("padNumber")  // Nur nach 'padNumber' sortieren
        );
    
        // Echtzeitlistener
        onSnapshot(messagesQuery, (querySnapshot) => {
            this.messages = {}; // Nachrichten leeren
    
            querySnapshot.forEach((doc) => {
                const messageData = doc.data() as Message;
                this.messages[doc.id] = messageData; // Nachricht speichern mit ihrer ID als Schlüssel
            });
        });
    }
    
    
    
    

    getAllMessages() {
        this.allMessages = {};  // Leere das Nachrichten-Objekt
    
        // Durchlaufe alle Benutzer aus der usersList
        this.chat.usersList.forEach((user) => {
            // Erstelle einen eindeutigen Chat-Pfad basierend auf den Benutzer-IDs
            const chatId = this.currentUser.currentUser.id < user.id
                ? `${this.currentUser.currentUser.id}_${user.id}`
                : `${user.id}_${this.currentUser.currentUser.id}`;
    
            const potentialCollectionRef = collection(
                this.firestore,
                `directmessages/${chatId}/messages`
            );
    
            // Sortiere die Nachrichten nach dem Zeitstempel
            const messagesQuery = query(
                potentialCollectionRef,
                orderBy("time")
            );
    
            // Setze einen Echtzeitlistener für die Nachrichten
            onSnapshot(messagesQuery, (messagesSnapshot) => {
                if (!messagesSnapshot.empty) {
                    // Stelle sicher, dass das Nachrichten-Objekt für diesen Benutzer existiert
                    if (!this.allMessages[user.id]) {
                        this.allMessages[user.id] = {};
                    }
    
                    // Durchlaufe die Nachrichten und speichere sie in allMessages
                    messagesSnapshot.forEach((messageDoc) => {
                        const messageData = messageDoc.data() as Message;
    
                        // Speichere die Nachricht mit der ID des Dokuments
                        this.allMessages[user.id][messageDoc.id] = {
                            ...messageData,
                            id: messageDoc.id,  // Füge die ID der Nachricht hinzu
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
