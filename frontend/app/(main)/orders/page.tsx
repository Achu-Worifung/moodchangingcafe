"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Loading from "@/app/loading";
import { db } from "@/lib/firebase";
import {
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "@/app/context/authContext";

export default function Orders() {
  const [oldReciepts, setOldReciepts] = useState<any[]>([]);
  const [currOrders, setCurrOrders] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser, userLoggedIn } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    async function fetchOrders() {
      const q = query(
        collection(db, "orders"),
        where("email", "==", currentUser?.email)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const pastOrders = orders.filter((order) => order.status === "completed");
      const ready = orders.filter((order) => order.status === "ready");
      const currentOrders = orders.filter(
        (order) => order.status !== "completed" && order.status !== "ready"
      );
      setOldReciepts(pastOrders);
      setReadyOrders(ready);
      setCurrOrders(currentOrders);
      unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
        const updatedAll = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const byUser = updatedAll.filter((o: any) => o.email === currentUser?.email);
        const updatedReady = byUser.filter((o: any) => o.status === "ready");
        const updatedCurrent = byUser.filter(
          (o: any) => o.status !== "completed" && o.status !== "ready"
        );
        setReadyOrders(updatedReady);
        setCurrOrders(updatedCurrent);
      });
      console.log("Fetched user orders:", orders);
      setLoading(false);
    }
    fetchOrders();
  }, [currentUser?.email, userLoggedIn]);
  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="w-full flex flex-col text-center">
          <Loading />
          <p className="text-2xl font-light ">Loading orders...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ready for Pickup Section */}
          {readyOrders && readyOrders.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-4">Ready for Pickup</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {readyOrders.map((order: any) => (
                  <div key={order.id} className="bg-white border border-green-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-500">Order #{order.id}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">ready</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.createdAt && typeof order.createdAt.toDate === "function"
                        ? new Date(order.createdAt.toDate()).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date unavailable"}
                    </p>
                    <div className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded p-3">
                      Your order is ready for pickup. Please come to the cafe to collect it.
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Current Orders Section */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Current Orders</h2>
            {currOrders && currOrders.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500 text-lg">No current orders</p>
                <p className="text-gray-400 text-sm mt-2">
                  Your active orders will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {currOrders &&
                  currOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-500">
                          Order #{order.id}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-md font-semibold 
                           
                          `}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.createdAt && typeof order.createdAt.toDate === "function"
                          ? new Date(order.createdAt.toDate()).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Date unavailable"}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Past Orders Section */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Past Orders</h2>
            {oldReciepts && oldReciepts.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500 text-lg">No past orders</p>
                <p className="text-gray-400 text-sm mt-2">
                  Your order history will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {oldReciepts &&
                  oldReciepts.map((order: any) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow opacity-80"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-500">
                          Order #{order.id}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt.toDate()).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
