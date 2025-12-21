import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export type UserRole = "admin" | "staff" | "user";
export const DEFAULT_ROLE: UserRole = "user";

export const doCreateUserWithEmailAndPassword = async (
  email: string,
  password: string,
  role: UserRole = DEFAULT_ROLE
) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = credential.user;



    // write the profile doc in Firestore
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          email,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (fireErr) {
      console.error("Firestore setDoc failed for users/%s:", uid, fireErr);
      throw new Error(`Failed to create user profile in Firestore: ${fireErr?.message ?? fireErr}`);
    }

    return credential; 
  } catch (err: any) {
    console.error("Error in createUserWithEmailAndPassword:", err);
    throw new Error(err?.code ? `${err.code} - ${err.message}` : err?.message ?? String(err));
  }
};

export const doSetUserRole = async (uid: string, role: UserRole) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      { role, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("doSetUserRole error:", err);
    throw err;
  }
};

export const doGetUserRole = async (uid: string): Promise<UserRole> => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.data();
    const role = data?.role as UserRole | undefined;
    return role ?? DEFAULT_ROLE;
  } catch (err) {
    console.error("doGetUserRole error:", err);
    return DEFAULT_ROLE; 
  }
};

export const doSignInWithEmailAndPassword = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignOut = () => {
  return auth.signOut();
};


export const doGetCurrentUser = () => {
  return auth.currentUser;
};

export const doPasswordChange = (password: string) => {
  if (auth.currentUser) {
    return updatePassword(auth.currentUser, password);
  }
  return Promise.reject(new Error("No current user to update password for"));
};
