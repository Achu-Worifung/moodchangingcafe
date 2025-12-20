// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOLVdQ6zYGJQYgk5gfP2yvvLxZpMbFKyU",
  authDomain: "moodchangingcafe.firebaseapp.com",
  databaseURL: "https://moodchangingcafe-default-rtdb.firebaseio.com",
  projectId: "moodchangingcafe",
  storageBucket: "moodchangingcafe.firebasestorage.app",
  messagingSenderId: "1053433403648",
  appId: "1:1053433403648:web:5cc2a686c91634bb96fbe5",
  measurementId: "G-5Q140V5N2L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;