import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { auth, googleProvider, db } from "../services/firebase";
import { signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AuthContextType } from "../types/index";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async (uid: string) => {
    const adminRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists();
  };

  async function googleSignIn() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const isUserAdmin = await checkAdminStatus(result.user.uid);
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Failed to sign in");
      throw error;
    }
  }

  async function logout() {
    try {
      setError(null);
      await signOut(auth);
      setIsAdmin(false);
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out");
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const isUserAdmin = await checkAdminStatus(user.uid);
        setIsAdmin(isUserAdmin);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser: currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
          meals: 0,
        }
      : null,
    isAdmin: true,
    loading,
    error,
    googleSignIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
