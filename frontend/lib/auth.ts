import {auth} from "@/lib/firebase";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
export const doCreateUserWithEmailAndPassword = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
}

export const doSignInWithEmailAndPassword = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
}

export const doSignOut = () => {
    return auth.signOut();
    
}

export const doGetCurrentUser = () => {
    return auth.currentUser;
}
// export const doPasswordReset = (email: string) => {
//     return auth.sendPasswordResetEmail(email);
// }
export const doPasswordChange = (password: string) => {
    if (auth.currentUser) {
        return updatePassword(auth.currentUser, password);
    }
}
// export const doSendEmailVerification = () => {
//     if (auth.currentUser) {
//         return auth.currentUser.sendEmailVerification();
//     }
// }
// export const doSignInWithGoogle = () => {
//     const provider = new GoogleAuthProvider();
//     const result = auth.signInWithPopup(auth, provider);
//     // result.user 
//     return result;
// }
