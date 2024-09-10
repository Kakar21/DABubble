import { Injectable, OnInit } from '@angular/core';
import { SearchResult } from '../../interfaces/search-result';
import { FirestoreService } from '../../firestore.service';
import { collection, doc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { CurrentuserService } from '../../currentuser.service';
import { Channel } from '../../interfaces/channel';
import { Message } from '../../interfaces/message';
import { ChatService } from '../chat/chat.service';
import { UsersList } from '../../interfaces/users-list';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  channels: Record<string, Channel> = {};
  allChannelMessages: Record<string, Message[]> = {};
  allDirectMessages: { [userId: string]: { [messageId: string]: any; }; } = {};
  usersList: UsersList[] = [];

  constructor(
    private firestore: FirestoreService,
    private currentUser: CurrentuserService,
    private chatService: ChatService

  ) { }



  searchMessagesAndChannels(query: string): SearchResult[] {
    const results: SearchResult[] = [];
  
    // 1. Channels durchsuchen
    Object.keys(this.allChannelMessages).forEach(channelId => {
      const messages = this.allChannelMessages[channelId].filter(message => {
        return message.message.toLowerCase().includes(query.toLowerCase());
      });
  
      messages.forEach(message => {
        results.push({
          type: 'channel',
          id: message.id,
          name: message.name,  // Channel-Name
          avatar: message.avatar,
          message: message.message,  // Nachricht
          padNumber: message.padNumber.toString(),
          channelName: this.channels[channelId].name,
          channelID: channelId
        });
      });
    });
  
    // 2. Direct Messages durchsuchen
    Object.keys(this.allDirectMessages).forEach(userId => {
      const userMessages = Object.values(this.allDirectMessages[userId]);
  
      const matchingMessages = userMessages.filter((message: Message) => {
        return message.message.toLowerCase().includes(query.toLowerCase());
      });
  
      matchingMessages.forEach(message => {
        results.push({
          type: 'user',
          id: message.id,
          name: message.name,  // Benutzername
          avatar: message.avatar,
          message: message.message,  // Nachricht
          padNumber: message.padNumber,
          userID: userId
        });
      });
    });
  
    return results;
  }
  

  loadAllChannels() {
    const channelsRef = this.firestore.channelsRef;

    // Echtzeit-Listener für alle Kanäle
    onSnapshot(channelsRef, (querySnapshot) => {
      querySnapshot.forEach((channelDoc) => {
        const channelId = channelDoc.id;
        const channelData = channelDoc.data();
        // Prüfe, ob der aktuelle Benutzer Mitglied des Kanals ist
        if (channelData['members'] && channelData['members'].some((member: { id: string; }) => member.id === this.currentUser.currentUser.id)) {
          // Überprüfen, ob der Kanal schon geladen wurde
          if (!this.channels[channelId]) {
            this.channels[channelId] = {
              name: channelData["name"] || "",
              description: channelData["description"] || "",
              creator: channelData["creator"] || "",
              members: channelData["members"] || [],
              messages: new Map(),
            };
          }

          // Nachrichten für diesen Kanal laden
          const messagesCollectionRef = collection(
            this.firestore.firestore,
            `channels/${channelId}/messages`
          );
          const messagesQuery = query(messagesCollectionRef, orderBy("time"));
          // Nachrichten-Listener für den Kanal
          onSnapshot(messagesQuery, (messagesSnapshot) => {
            const messages: Message[] = [];

            messagesSnapshot.forEach((doc) => {
              const messageData = doc.data() as Message;
              this.channels[channelId].messages?.set(doc.id, messageData);
              messages.push(messageData);  // Nachrichten sammeln
            });

            this.allChannelMessages[channelId] = messages;  // Nachrichten für den Kanal speichern
          });

          // Kanaldaten (Name, Beschreibung, Mitglieder) aktualisieren
          onSnapshot(doc(channelsRef, channelId), (docSnap) => {
            if (docSnap.exists()) {
              this.channels[channelId].name = docSnap.data()["name"];
              this.channels[channelId].creator = docSnap.data()["creator"];
              this.channels[channelId].members = docSnap.data()["members"] || [];
              this.channels[channelId].description =
                docSnap.data()["description"] || "";
            }
          });
        }
      });
    });
  }


  loadAllDirectmessages() {
    this.allDirectMessages = {};  // Leere das Nachrichten-Objekt

    // Lade die Benutzerliste und starte dann das Laden der Direktnachrichten
    this.subUsersList(() => {
      // Durchlaufe alle Benutzer aus der usersList
      this.usersList.forEach((user) => {
        // Erstelle einen eindeutigen Chat-Pfad basierend auf den Benutzer-IDs
        const chatId = this.currentUser.currentUser.id < user.id
          ? `${this.currentUser.currentUser.id}_${user.id}`
          : `${user.id}_${this.currentUser.currentUser.id}`;

        const potentialCollectionRef = collection(
          this.firestore.firestore,
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
            if (!this.allDirectMessages[user.id]) {
              this.allDirectMessages[user.id] = {};
            }

            // Durchlaufe die Nachrichten und speichere sie in allMessages
            messagesSnapshot.forEach((messageDoc) => {
              const messageData = messageDoc.data() as Message;

              // Speichere die Nachricht mit der ID des Dokuments
              this.allDirectMessages[user.id][messageDoc.id] = {
                ...messageData,
                id: messageDoc.id,  // Füge die ID der Nachricht hinzu
              };
            });
          }
        });
      });
    });
  }

  subUsersList(callback: () => void) {
    let ref = this.firestore.usersRef;
    onSnapshot(ref, (list) => {
      this.usersList = [];
      list.forEach((element) => {
        this.usersList.push(
          this.setUsersListObj(element.data(), element.id),
        );
      });

      // Wenn die Benutzerliste geladen wurde, rufe den Callback auf
      if (this.usersList.length > 0) {
        callback();
      }
    });
  }

  setUsersListObj(obj: any, id: string): UsersList {
    return {
      id: id || "",
      name: obj.name || "",
      avatar: obj.avatar || "",
      email: obj.email || "",
      online: obj.online || false,
    };
  }

}
