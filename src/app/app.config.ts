import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { getDatabase, provideDatabase } from "@angular/fire/database";
import { getStorage, provideStorage } from "@angular/fire/storage";

export const firebaseConfig = {
    apiKey: "AIzaSyB5LI6OKON58XLPG2G-N6dWAR9ROcDkq8Q",
    authDomain: "dabubble-aaa9e.firebaseapp.com",
    databaseURL: "https://dabubble-aaa9e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dabubble-aaa9e",
    storageBucket: "dabubble-aaa9e.appspot.com",
    messagingSenderId: "564819078942",
    appId: "1:564819078942:web:4c389300cb1264f959e30f"
  };

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        provideFirebaseApp(() => initializeApp(firebaseConfig)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideDatabase(() => getDatabase()),
        provideStorage(() => getStorage()),
    ],
};

