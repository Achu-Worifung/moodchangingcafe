"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import Loading from "@/app/loading";

export default function Orders() {
  const [oldReciepts, setOldReciepts] = useState([]);
  const [currOrders, setCurrOrders] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { token } = useAuth();

  useEffect(() => {
    
    async function fetchOrders() {
      const res = await fetch("http://127.0.0.1:8000/api/orders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        toast.error("Failed to fetch orders. Please try again.");
        return;
      }
      const data = await res.json();
      setCurrOrders(data.orders);
      setOldReciepts(data.old_reciepts);
        console.log("Fetched orders:", data.orders);
        console.log("Fetched old reciepts:", data.old_reciepts);
        setLoading(false);
    }
    async function orderTracking()
    {
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${token}`);
        
        socket.onopen = () => {
            console.log("WebSocket connection opened: Orders tracking");
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            setCurrOrders(data.orders);
            setOldReciepts(data.old_reciepts);
        };
        
        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
        
        socket.onclose = () => {
            console.log("WebSocket connection closed: Orders tracking");
            // Don't reconnect immediately - let user manually reconnect or refresh
        };
    }
    fetchOrders();
    orderTracking();
  }, [token]);
  return (
    <div className="container mx-auto px-4 py-8">
       {
        loading ? (
            <div className="w-full flex flex-col text-center">
                        <Loading />
                        <p className="text-2xl font-light ">Loading orders...</p>
                      </div>
        ) : (
          <div className="space-y-8">
            {/* Current Orders Section */}
            <section>
              <h2 className="text-3xl font-bold mb-4">Current Orders</h2>
              {currOrders && currOrders.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-500 text-lg">No current orders</p>
                  <p className="text-gray-400 text-sm mt-2">Your active orders will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currOrders && currOrders.map((order: any) => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-500">Order #{order.id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        ${parseFloat(order.total_price).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
                  <p className="text-gray-400 text-sm mt-2">Your order history will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {oldReciepts && oldReciepts.map((order: any) => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow opacity-80">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-500">Order #{order.id}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        ${parseFloat(order.total_price).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )
       }
    </div>
  );
}
