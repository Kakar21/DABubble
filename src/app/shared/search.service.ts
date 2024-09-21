import { Injectable } from '@angular/core';
import { SearchResult } from '../interfaces/search-result';
import { FirestoreService } from './firestore.service';
import { collection, doc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { CurrentuserService } from './currentuser.service';
import { Channel } from '../interfaces/channel';
import { Message } from '../interfaces/message';
import { UsersList } from '../interfaces/users-list';

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
  ) { }


  searchMessagesAndChannels(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    this.searchChannelMessages(query, results);
    this.searchDirectMessages(query, results);
    return results;
  }


  private searchChannelMessages(query: string, results: SearchResult[]) {
    Object.keys(this.allChannelMessages).forEach(channelId => {
      const messages = this.allChannelMessages[channelId].filter(message =>
        message.message.toLowerCase().includes(query.toLowerCase())
      );
      this.addChannelResults(messages, channelId, results);
    });
  }


  private addChannelResults(messages: Message[], channelId: string, results: SearchResult[]) {
    messages.forEach(message => {
      results.push({
        type: 'channel',
        id: message.id,
        name: message.name,
        avatar: message.avatar,
        message: message.message,
        padNumber: message.padNumber.toString(),
        channelName: this.channels[channelId].name,
        channelID: channelId
      });
    });
  }


  private searchDirectMessages(query: string, results: SearchResult[]) {
    Object.keys(this.allDirectMessages).forEach(userId => {
      const userMessages = Object.values(this.allDirectMessages[userId]);
      const matchingMessages = userMessages.filter((message: Message) =>
        message.message.toLowerCase().includes(query.toLowerCase())
      );
      this.addDirectMessageResults(matchingMessages, userId, results);
    });
  }


  private addDirectMessageResults(messages: Message[], userId: string, results: SearchResult[]) {
    messages.forEach(message => {
      results.push({
        type: 'user',
        id: message.id,
        name: message.name,
        avatar: message.avatar,
        message: message.message,
        padNumber: message.padNumber.toString(),
        userID: userId
      });
    });
  }


  loadAllChannels() {
    const channelsRef = this.firestore.channelsRef;
    onSnapshot(channelsRef, (querySnapshot) => {
      querySnapshot.forEach((channelDoc) => {
        this.processChannelSnapshot(channelDoc);
      });
    });
  }


  private processChannelSnapshot(channelDoc: any) {
    const channelId = channelDoc.id;
    const channelData = channelDoc.data();
    if (this.isCurrentUserInChannel(channelData)) {
      if (!this.channels[channelId]) this.createChannel(channelId, channelData);
      this.loadChannelMessages(channelId);
      this.updateChannelData(channelId);
    }
  }


  private isCurrentUserInChannel(channelData: any): boolean {
    return channelData['members'] &&
      channelData['members'].some((member: { id: string; }) => member.id === this.currentUser.currentUser.id);
  }


  private createChannel(channelId: string, channelData: any) {
    this.channels[channelId] = {
      name: channelData["name"] || "",
      description: channelData["description"] || "",
      creator: channelData["creator"] || "",
      members: channelData["members"] || [],
      messages: new Map(),
    };
  }


  private loadChannelMessages(channelId: string) {
    const messagesCollectionRef = collection(this.firestore.firestore, `channels/${channelId}/messages`);
    const messagesQuery = query(messagesCollectionRef, orderBy("time"));
    onSnapshot(messagesQuery, (messagesSnapshot) => {
      const messages = this.collectChannelMessages(messagesSnapshot, channelId);
      this.allChannelMessages[channelId] = messages;
    });
  }


  private collectChannelMessages(messagesSnapshot: any, channelId: string): Message[] {
    const messages: Message[] = [];
    messagesSnapshot.forEach((doc: any) => {
      const messageData = doc.data() as Message;
      this.channels[channelId].messages?.set(doc.id, messageData);
      messages.push(messageData);
    });
    return messages;
  }


  private updateChannelData(channelId: string) {
    onSnapshot(doc(this.firestore.channelsRef, channelId), (docSnap) => {
      if (docSnap.exists()) {
        const channel = docSnap.data();
        this.channels[channelId].name = channel["name"];
        this.channels[channelId].creator = channel["creator"];
        this.channels[channelId].members = channel["members"] || [];
        this.channels[channelId].description = channel["description"] || "";
      }
    });
  }


  loadAllDirectmessages() {
    this.allDirectMessages = {};
    this.subUsersList(() => this.loadDirectMessagesForUsers());
  }


  private loadDirectMessagesForUsers() {
    this.usersList.forEach((user) => {
      const chatId = this.createChatId(user.id);
      this.loadDirectMessagesForUser(chatId, user.id);
    });
  }


  private createChatId(userId: string): string {
    return this.currentUser.currentUser.id < userId
      ? `${this.currentUser.currentUser.id}_${userId}`
      : `${userId}_${this.currentUser.currentUser.id}`;
  }


  private loadDirectMessagesForUser(chatId: string, userId: string) {
    const potentialCollectionRef = collection(this.firestore.firestore, `directmessages/${chatId}/messages`);
    const messagesQuery = query(potentialCollectionRef, orderBy("time"));
    onSnapshot(messagesQuery, (messagesSnapshot) => {
      if (!messagesSnapshot.empty) {
        this.saveDirectMessages(messagesSnapshot, userId);
      }
    });
  }


  private saveDirectMessages(messagesSnapshot: any, userId: string) {
    if (!this.allDirectMessages[userId]) this.allDirectMessages[userId] = {};
    messagesSnapshot.forEach((messageDoc: any) => {
      const messageData = messageDoc.data() as Message;
      this.allDirectMessages[userId][messageDoc.id] = { ...messageData, id: messageDoc.id };
    });
  }


  subUsersList(callback: () => void) {
    let ref = this.firestore.usersRef;
    onSnapshot(ref, (list) => {
      this.usersList = [];
      list.forEach((element) => {
        this.usersList.push(
          this.currentUser.setUsersListObj(element.data(), element.id),
        );
      });

      // Wenn die Benutzerliste geladen wurde, rufe den Callback auf
      if (this.usersList.length > 0) {
        callback();
      }
    });
  }
}
