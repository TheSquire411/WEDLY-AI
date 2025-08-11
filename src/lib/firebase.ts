
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import centralized configuration
import { public as publicConfig } from '@/lib/config';

// Get Firebase configuration from centralized config
const firebaseConfig = publicConfig.firebase;

// Validate required Firebase configuration
if (!firebaseConfig.apiKey) {
  throw new Error("Firebase API key is missing. Please check your environment variables.");
}

if (!firebaseConfig.authDomain) {
  throw new Error("Firebase auth domain is missing. Please check your environment variables.");
}

if (!firebaseConfig.projectId) {
  throw new Error("Firebase project ID is missing. Please check your environment variables.");
}

if (!firebaseConfig.storageBucket) {
  throw new Error("Firebase storage bucket is missing. Please check your environment variables.");
}

if (!firebaseConfig.messagingSenderId) {
  throw new Error("Firebase messaging sender ID is missing. Please check your environment variables.");
}

if (!firebaseConfig.appId) {
  throw new Error("Firebase app ID is missing. Please check your environment variables.");
}

// Initialize Firebase with centralized configuration
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
