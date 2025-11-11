import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB3lM1fE7tbMAtDwWS1ZJT2Q2KAVo9Tirc",
  authDomain: "unote-c808a.firebaseapp.com",
  projectId: "unote-c808a",
  storageBucket: "unote-c808a.firebasestorage.app",
  messagingSenderId: "741839978281",
  appId: "1:741839978281:web:ef04a6295d6015d1004138",
  measurementId: "G-ZFMT67J8L3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
