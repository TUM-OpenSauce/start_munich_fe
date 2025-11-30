import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithCustomToken, 
    signInAnonymously 
} from 'firebase/auth';

// Global variables provided by the Canvas environment for Firebase setup
declare const __initial_auth_token: string | undefined;

const firebaseConfig = {
  apiKey: "AIzaSyBcZ1WFeOeWg2C3x7IU0sYjDYymWc84XbU",
  authDomain: "opensauce-6bef9.firebaseapp.com",
  projectId: "opensauce-6bef9",
  storageBucket: "opensauce-6bef9.firebasestorage.app",
  messagingSenderId: "625648332564",
  // appId: "1:625648332564:web:5d9b08a13fa61f800b9c01",
  appId: "1:625648332564:web:16cf3d7cd08f48780b9c01",
  measurementId: "G-17VTRKR8ES"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

// Function to handle initial sign-in using custom token or anonymously
export const initializeAuth = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Firebase initialized: Signed in with custom token.");
        } else {
            await signInAnonymously(auth);
            console.log("Firebase initialized: Signed in anonymously.");
        }
    } catch (error) {
        console.error("Error during initial authentication:", error);
    }
};

// Call the initialization function immediately
initializeAuth();

