import { onAuthStateChanged, User } from "firebase/auth";
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
    currentUser: User | null;
    userLoggedIn: boolean;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    function handleAuthChange(user: User | null) {
        setCurrentUser(user);
        setUserLoggedIn(!!user);
        setLoading(false);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
        return unsubscribe;
    }, []);

    const value: AuthContextValue = {
        currentUser,
        userLoggedIn,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}