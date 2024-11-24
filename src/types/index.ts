export interface User {
  uid: string;
  email: string;
  meals: number;
}

export interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  googleSignIn: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface Transaction {
  id: string;
  points: number;
  timestamp: Date;
  type: "earn" | "redeem";
  restaurantName: string;
}
