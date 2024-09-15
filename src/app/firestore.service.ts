import { Injectable, inject } from "@angular/core";
import {
    Firestore,
    collection,
    doc,
    setDoc,
    onSnapshot,
    getFirestore,
    CollectionReference,
    DocumentData,
    getDocs,
    serverTimestamp,
} from "@angular/fire/firestore";
import { Observable } from "rxjs";
import {
    getAuth,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
} from "firebase/auth";
import { Router } from "@angular/router";
import {
    getRedirectResult,
    signInWithPopup,
    signOut,
    updateEmail,
} from "@angular/fire/auth";
import { User } from "./interfaces/user";
import { getDatabase, onDisconnect, onValue, ref, set } from "@angular/fire/database";
import { appConfig, firebaseConfig } from "./app.config";
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
    app = initializeApp(firebaseConfig)
    db = getDatabase(this.app, "https://dabubble-2a68b-default-rtdb.europe-west1.firebasedatabase.app");


    constructor(private router: Router) {
        this.usersRef = collection(this.firestore, "users");
        this.channelsRef = collection(this.firestore, "channels");
    
        this.currentUser$ = new Observable((observer) => {
            onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    console.log("Benutzer angemeldet:", user.uid);
                    observer.next(user.uid);
                    this.currentUserID = user.uid;
                    this.startHeartbeat(user.uid); // Heartbeat starten
                    if (
                        this.router.url === "/login" ||
                        this.router.url === "/signup" ||
                        this.router.url === "/recovery" ||
                        this.router.url === "/reset-password"
                    ) {
                        this.router.navigate(["/"]);
                    }
                } else {
                    console.log("Kein Benutzer angemeldet");
                    observer.next(null);
                    this.stopHeartbeat(); // Heartbeat stoppen
                    if (this.router.url === "/") {
                        this.router.navigate(["/login"]);
                    }
                }
            });
        });
    }

    private startHeartbeat(userId: string) {
        this.userStatusDatabaseRef = ref(this.db, `status/${userId}`);
    
        // Setze den Online-Status
        set(this.userStatusDatabaseRef, {
            online: true,
            lastActive: new Date().toISOString(),  // Manuell generierter Timestamp
        });
    
        // Offline-Status setzen, wenn die Verbindung unterbrochen wird
        onDisconnect(this.userStatusDatabaseRef).set({
            online: false,
            lastActive: new Date().toISOString(),  // Manuell generierter Timestamp
        });
    
        // Heartbeat alle 10 Sekunden senden
        this.heartbeatInterval = setInterval(() => {
            set(this.userStatusDatabaseRef, {
                online: true,
                lastActive: new Date().toISOString(),  // Manuell generierter Timestamp
            });
        }, 10000);  // Alle 10 Sekunden
    }
    
    
    
    
    
    private stopHeartbeat() {
        if (!this.currentUserID) {
            console.log("Kein Benutzer eingeloggt, Heartbeat-Stop wird übersprungen.");
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
    
    
    getUserStatus(userId: string, callback: (status: { online: boolean }) => void): void {
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
    
      // Abfrage des Online-Status für mehrere Benutzer
      getUsersStatus(userIds: string[], callback: (statuses: { [key: string]: boolean }) => void): void {
        const db = getDatabase();
        const statuses: { [key: string]: boolean } = {};
    
        userIds.forEach(userId => {
          const statusRef = ref(db, `status/${userId}`);
    
          onValue(statusRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              statuses[userId] = data.online;
            } else {
              statuses[userId] = false;
            }
    
            // Wenn alle Statusdaten abgerufen wurden
            if (Object.keys(statuses).length === userIds.length) {
              callback(statuses);  // Callback mit den gesammelten Statusdaten
            }
          });
        });
      }


    getFirestore(): Firestore {
        return this.firestore;
    }

    loginWithGoogle = () => {
        signInWithPopup(this.auth, this.provider)
            .then(async (result) => {
                // User information is already available in the result from signInWithPopup
                const user = result.user;
    
                // Save the user data in Firestore
                await this.saveUser(
                    {
                        avatar: user.photoURL || "",
                        name: user.displayName || "",
                        email: user.email || "",
                    },
                    user.uid,
                );
    
                // Navigate to home or any other route after successful login
                await this.router.navigate(["/"]);
            })
            .catch((error) => {
                console.error("Google sign-in error:", error);
            });
    };
    

    signUpWithEmailAndPassword(
        email: string,
        password: string,
    ): Promise<string> {
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

    loginWithEmailAndPassword = (
        email: string,
        password: string,
    ): Promise<string | null> => {
        return signInWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Anmeldung erfolgreich", user.uid);
                this.router.navigate(["/"]);
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
                console.log("User erfolgreich ausgeloggt");
                this.currentUserID = '';  // Clear the current user ID after logout
                this.router.navigate(['/login']);  // Weiterleitung nach dem Ausloggen
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
            .then(() => {
                console.log("Passwort-Reset-E-Mail gesendet.");
            })
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
                console.log("Email successfully updated!");
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

    async updateUserInChannels(updatedUser: { id: string, name: string, email: string, avatar: string }) {
        // Holen Sie alle Channels ab
        const channelsSnapshot = await getDocs(this.channelsRef);
    
        // Durchlaufen Sie jeden Channel
        channelsSnapshot.forEach(async (channelDoc) => {
            const channelData = channelDoc.data();
    
            // Wenn der Channel Mitglieder hat
            if (channelData["members"] && Array.isArray(channelData["members"])) {
                const memberIndex = channelData["members"].findIndex((member: any) => member.id === updatedUser.id);
    
                // Wenn der Benutzer in den Mitgliedern dieses Channels ist
                if (memberIndex !== -1) {
                    // Aktualisieren Sie die Benutzerinformationen in der members-Liste
                    channelData["members"][memberIndex] = {
                        ...channelData["members"][memberIndex],
                        name: updatedUser.name,
                        email: updatedUser.email,
                        avatar: updatedUser.avatar
                    };
    
                    // Speichern Sie die aktualisierten Mitgliederinformationen in der Datenbank
                    await setDoc(doc(this.channelsRef, channelDoc.id), { members: channelData["members"] }, { merge: true });
    
                    console.log(`User ${updatedUser.id} updated in channel ${channelDoc.id}`);
                }
            }
        });
    }

    async updateUserInChannelCreators(oldName: string, newName: string) {
        // Holen Sie alle Channels ab
        const channelsSnapshot = await getDocs(this.channelsRef);
    
        // Durchlaufen Sie jeden Channel
        channelsSnapshot.forEach(async (channelDoc) => {
            const channelData = channelDoc.data();
    
            // Überprüfen, ob der alte Name des Benutzers als creator im Channel hinterlegt ist
            if (channelData["creator"] && channelData["creator"] === oldName) {
                // Aktualisieren Sie den Namen des Erstellers
                await setDoc(doc(this.channelsRef, channelDoc.id), { creator: newName }, { merge: true });
    
                console.log(`Creator name updated from ${oldName} to ${newName} in channel ${channelDoc.id}`);
            }
        });
    }    
    

    loginAsGuest() {
        const guestEmail = "guest@guest.guest";
        const guestPassword = "guest1";
        return this.loginWithEmailAndPassword(guestEmail, guestPassword);
    }
}
