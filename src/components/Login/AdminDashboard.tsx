import { useState } from "react";
import QrReader from "react-qr-scanner";
import { db } from "../../services/firebase";
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDoc,
} from "firebase/firestore";

interface ScanResult {
  action: string;
  uid: string;
  timestamp: number;
  currentMeals: number;
}

export default function AdminDashboard() {
  const [scanning, setScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string>("");

  const handleScan = async (data: string | null) => {
    if (!data) return;

    try {
      const scanData: ScanResult = JSON.parse(data);

      // Verify timestamp is within last 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (scanData.timestamp < fiveMinutesAgo) {
        setLastScan("QR code expired. Please generate a new one.");
        return;
      }

      if (scanData.action === "ADD_MEAL") {
        // Get user reference
        const userRef = doc(db, "users", scanData.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setLastScan("User not found");
          return;
        }

        // Update meals count
        await updateDoc(userRef, {
          meals: increment(1),
        });

        // Add transaction
        await addDoc(collection(db, `users/${scanData.uid}/transactions`), {
          type: "meal",
          timestamp: new Date(),
          restaurantName: "Restaurant Name", // Replace with actual restaurant name
        });

        setLastScan("Meal added successfully!");
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      setLastScan("Invalid QR code");
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setLastScan("Error scanning QR code");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Scan Customer QR Code
          </h2>

          <div className="relative">
            {scanning && (
              <QrReader
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: "100%" }}
                constraints={{
                  facingMode: "environment",
                }}
              />
            )}

            <button
              onClick={() => setScanning(!scanning)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {scanning ? "Pause Scanner" : "Start Scanner"}
            </button>
          </div>

          {lastScan && (
            <div
              className={`mt-4 p-4 rounded ${
                lastScan.includes("successfully")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {lastScan}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
