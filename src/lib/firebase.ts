
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAloQLFRyrY3fUEIiJgyq4arnv52PEDSgY",
  authDomain: "wedly-minimal.firebaseapp.com",
  projectId: "wedly-minimal",
  storageBucket: "wedly-minimal.appspot.com",
  messagingSenderId: "974305323252",
  appId: "1:974305323252:web:8733e74b8405a2111a96a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
