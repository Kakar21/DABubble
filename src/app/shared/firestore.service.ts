import { Injectable, inject } from "@angular/core";
import { Firestore, collection, doc, setDoc, CollectionReference, DocumentData, getDocs } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
import { Router } from "@angular/router";
import { signInWithPopup, signOut, updateEmail } from "@angular/fire/auth";
import { User } from "../interfaces/user";
import { getDatabase, onDisconnect, onValue, ref, set } from "@angular/fire/database";
import { firebaseConfig } from "../app.config";
import { initializeApp } from "@angular/fire/app";

@Injectable({
  providedIn: "root",
})
export class FirestoreService {
  firestore: Firestore = inject(Firestore);
  auth = getAuth();
  provider = new GoogleAuthProvider();
  currentUser$: Observable<string | null>;
  currentUserID = "";
  usersRef: CollectionReference<DocumentData>;
  channelsRef: CollectionReference<DocumentData>;
  private userStatusDatabaseRef: any;
  private heartbeatInterval: any;
  app = initializeApp(firebaseConfig);
  db = getDatabase(this.app, firebaseConfig.databaseURL);


  constructor(private router: Router) {
    this.usersRef = collection(this.firestore, "users");
    this.channelsRef = collection(this.firestore, "channels");
    this.currentUser$ = new Observable(this.observeAuthState);
  }


  private observeAuthState = (observer: any) => {
    onAuthStateChanged(this.auth, (user) => {
      user ? this.handleUserLogin(observer, user) : this.handleUserLogout(observer);
    });
  };


  private handleUserLogin(observer: any, user: any) {
    observer.next(user.uid);
    this.currentUserID = user.uid;
    this.startHeartbeat(user.uid);
    this.redirectAuthenticatedUser();
  }


  private handleUserLogout(observer: any) {
    observer.next(null);
    this.stopHeartbeat();
    if (this.router.url === "/") this.router.navigate(["/login"]);
  }


  private redirectAuthenticatedUser() {
    const restrictedRoutes = ["/login", "/signup", "/recovery", "/reset-password"];
    if (restrictedRoutes.includes(this.router.url)) this.router.navigate(["/"]);
  }


  private startHeartbeat(userId: string) {
    this.userStatusDatabaseRef = ref(this.db, `status/${userId}`);
    this.setUserOnlineStatus();
    onDisconnect(this.userStatusDatabaseRef).set({ online: false, lastActive: new Date().toISOString() });
    this.heartbeatInterval = setInterval(() => this.setUserOnlineStatus(), 10000);
  }


  private setUserOnlineStatus() {
    set(this.userStatusDatabaseRef, { online: true, lastActive: new Date().toISOString() });
  }


  private stopHeartbeat() {
    if (!this.currentUserID) {
      return;  // Keine Aktionen, wenn kein Benutzer eingeloggt ist
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.userStatusDatabaseRef) {
      // Benutzer als offline markieren, wenn authentifiziert
      set(this.userStatusDatabaseRef, {
        online: false,
        lastActive: new Date().toISOString(),  // Manuell generierter Timestamp
      });
    }

    this.currentUserID = '';  // Benutzer-ID löschen, da kein Benutzer mehr eingeloggt ist
  }


  getUserStatus(userId: string, callback: (status: { online: boolean; }) => void): void {
    const db = getDatabase();
    const statusRef = ref(db, `status/${userId}`);

    onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        callback({ online: data.online });
      } else {
        callback({ online: false });
      }
    });
  }


  getUsersStatus(userIds: string[], callback: (statuses: { [key: string]: boolean; }) => void): void {
    const statuses: { [key: string]: boolean; } = {};
    userIds.forEach((userId) => this.getUserStatusForId(userId, statuses, userIds, callback));
  }


  private getUserStatusForId(userId: string, statuses: { [key: string]: boolean; }, userIds: string[], callback: (statuses: { [key: string]: boolean; }) => void) {
    const statusRef = ref(this.db, `status/${userId}`);
    onValue(statusRef, (snapshot) => {
      statuses[userId] = snapshot.exists() ? snapshot.val().online : false;
      if (Object.keys(statuses).length === userIds.length) callback(statuses);
    });
  }


  getFirestore(): Firestore {
    return this.firestore;
  }


  loginWithGoogle = () => {
    signInWithPopup(this.auth, this.provider)
      .then(this.handleGoogleSignIn)
      .catch(this.handleGoogleSignInError);
  };


  private handleGoogleSignIn = async (result: any) => {
    const user = result.user;
    await this.saveUser({ avatar: user.photoURL || "", name: user.displayName || "", email: user.email || "" }, user.uid);
    await this.router.navigate(["/"]);
  };


  private handleGoogleSignInError = (error: any) => {
    console.error("Google sign-in error:", error);
  };


  signUpWithEmailAndPassword(email: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          resolve(user.uid);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }


  loginWithEmailAndPassword = (email: string, password: string): Promise<string | null> => {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        location.reload();
        return null;
      })
      .catch((error) => {
        return error.code;
      });
  };


  logout() {
    this.stopHeartbeat();  // Setze den Online-Status auf false und stoppe den Heartbeat
    signOut(this.auth)
      .then(() => {
        this.currentUserID = '';  // Clear the current user ID after logout
        location.reload();
      })
      .catch((error) => {
        console.error("Fehler beim Ausloggen: ", error);
      });
  }


  async saveUser(item: User, uid: string) {
    await setDoc(
      doc(this.usersRef, uid),
      {
        avatar: item.avatar,
        name: item.name,
        email: item.email,
      },
      { merge: true },
    );
  }


  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email)
      .catch((error) => {
        console.error(
          "Fehler beim Senden der Passwort-Reset-E-Mail: ",
          error,
        );
        throw error;
      });
  }


  confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    return confirmPasswordReset(this.auth, code, newPassword);
  }


  async updateEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      try {
        await updateEmail(user, newEmail);
      } catch (error) {
        console.error("Error updating email:", error);
        throw error;
      }
    } else {
      throw new Error("No user logged in!");
    }
  }


  async updateUser(name: string, email: string, avatar: string) {
    const user = {
      avatar: avatar,
      name: name,
      email: email,
    };

    this.saveUser(user, this.currentUserID);
  }


  async updateUserInChannels(updatedUser: { id: string; name: string; email: string; avatar: string; }) {
    const channelsSnapshot = await getDocs(this.channelsRef);
    channelsSnapshot.forEach((channelDoc) => this.updateChannelIfMember(channelDoc, updatedUser));
  }


  private async updateChannelIfMember(channelDoc: any, updatedUser: { id: string; name: string; email: string; avatar: string; }) {
    const channelData = channelDoc.data();
    if (channelData["members"] && Array.isArray(channelData["members"])) {
      const memberIndex = channelData["members"].findIndex((member: any) => member.id === updatedUser.id);
      if (memberIndex !== -1) this.updateChannelMembers(channelDoc, channelData, memberIndex, updatedUser);
    }
  }


  private async updateChannelMembers(channelDoc: any, channelData: any, memberIndex: number, updatedUser: { id: string; name: string; email: string; avatar: string; }) {
    channelData["members"][memberIndex] = { ...channelData["members"][memberIndex], name: updatedUser.name, email: updatedUser.email, avatar: updatedUser.avatar };
    await setDoc(doc(this.channelsRef, channelDoc.id), { members: channelData["members"] }, { merge: true });
  }


  async updateUserInChannelCreators(oldName: string, newName: string) {
    const channelsSnapshot = await getDocs(this.channelsRef);

    channelsSnapshot.forEach(async (channelDoc) => {
      const channelData = channelDoc.data();

      // Überprüfen, ob der alte Name des Benutzers als creator im Channel hinterlegt ist
      if (channelData["creator"] && channelData["creator"] === oldName) {
        // Aktualisieren Sie den Namen des Erstellers
        await setDoc(doc(this.channelsRef, channelDoc.id), { creator: newName }, { merge: true });
      }
    });
  }


  loginAsGuest() {
    const guestEmail = "guest@guest.guest";
    const guestPassword = "guest1";
    return this.loginWithEmailAndPassword(guestEmail, guestPassword);
  }

  
  isUserGuest(userId: string | null) {
    return userId === "BAOo731wv0SBK2X40vdmrUCuJVj1";
  }
}
