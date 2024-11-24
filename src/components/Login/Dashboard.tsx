import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

interface Transaction {
  id: string;
  timestamp: Date;
  type: "meal" | "free";
  restaurantName: string;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const mealsUntilFree = 6 - (currentUser?.meals ?? 0);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser) return;

      const q = query(
        collection(db, `users/${currentUser.uid}/transactions`),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const transactionData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Transaction[];

      setTransactions(transactionData);
    };

    fetchTransactions();
  }, [currentUser]);

  const generateQRData = () => {
    if (!currentUser?.uid) return "";
    return JSON.stringify({
      action: "ADD_MEAL",
      uid: currentUser.uid,
      timestamp: Date.now(),
      currentMeals: currentUser.meals ?? 0,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Meal Progress
          </h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg text-gray-600">
              {currentUser?.meals ?? 0} meals purchased
            </span>
            <span className="text-lg text-blue-600 font-semibold">
              {mealsUntilFree} until free meal
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 rounded-full h-4 transition-all duration-500"
              style={{
                width: `${(((currentUser?.meals ?? 0) % 6) / 6) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your QR Code
          </h2>
          <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
            <QRCodeSVG
              value={generateQRData()}
              size={200}
              level="H" // Highest error correction
              includeMargin={true}
            />
          </div>
          <p className="mt-4 text-gray-600">
            Show this to the restaurant to record your visit
          </p>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <p className="font-semibold">{transaction.restaurantName}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.timestamp.toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    transaction.type === "free"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {transaction.type === "free" ? "Free Meal" : "Meal Purchase"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
