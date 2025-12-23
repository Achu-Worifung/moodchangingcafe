"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase";
import {
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { useState, useEffect } from "react";
import { ShowOrderInfo } from "@/components/ui/show-order-info";
export default function LiveOrdersPage() {
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [noOrders, setNoOrders] = useState<boolean>(false);
  const [showOrderInfo, setShowOrderInfo] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    async function fetchLiveOrders() {
      try {
        const q = query(
          collection(db, "orders"),
          where("status", "!=", "completed")
        );
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLiveOrders(orders);
        console.log("Initial live orders fetched:", orders);
        if (orders.length === 0) setNoOrders(true);
        // Real-time updates via Firestore listener
        unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
          const updatedOrders = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((order) => order.status !== "completed");
          setLiveOrders(updatedOrders);
          if (updatedOrders.length === 0) setNoOrders(true);
        });
      } catch (error) {
        console.error("Error fetching live orders:", error);
      }
    }
    fetchLiveOrders();
    console.log("Live orders updated:", liveOrders);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  return (
    <div className="w-full flex flex-col flex-1 p-4 mt-14 h-full">
      <h1 className="text-center text-2xl font-semibold mb-4">Live Orders</h1>
      <ShowOrderInfo show={showOrderInfo} data={selectedOrder} setShow={setShowOrderInfo} />
      <Table className="">
        <TableCaption>List of live orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">From</TableHead>
            <TableHead>Total Items</TableHead>
            <TableHead>Total (USD)</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liveOrders.map((order) => (
            <TableRow key={order.id} onClick={() => {setSelectedOrder(order); setShowOrderInfo(true);}}>
              <TableCell className="font-medium">{order.email}</TableCell>
              <TableCell>{order.items.length}</TableCell>
              <TableCell>{order.total}</TableCell>
              <TableCell className="text-right">
                {order.status}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        
      </Table>
    </div>
  );
}
