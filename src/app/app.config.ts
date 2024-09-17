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
    apiKey: "AIzaSyD7uqij9obVTjDRwVKQzXxmXq2UJvD4S8c",
    authDomain: "dabubble-2a68b.firebaseapp.com",
    projectId: "dabubble-2a68b",
    storageBucket: "dabubble-2a68b.appspot.com",
    messagingSenderId: "274484134544",
    appId: "1:274484134544:web:330557e6aa3cbe735a0e15"
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

