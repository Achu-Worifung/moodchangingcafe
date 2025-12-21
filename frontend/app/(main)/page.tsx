'use client';
import Image from "next/image";
import { toast } from "sonner";
import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";
import { query, where, getDocs } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  const [items, setItems] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
         const q = query(
          collection(db, "items"),
          where("stock", ">", 0)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(items);
        console.log("Fetched items:", items);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);
  if (loading) {
    return (
      <div className="text-center">
        <Loading />
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items && items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow ease-in-out"
          onClick={() => router.push(`/item/${item.id}`)} >
            <img
              src={ item.img}
              alt={item.name || "Item image"}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {/* <p className="text-sm text-gray-600">{item.description}</p> */}
            <p className="text-sm font-medium mt-2">Price: ${item.unit_price}</p>
            {/* <p className="text-sm">Stock: {item.quantity_in_stock}</p> */}
            {/* <p className="text-sm">Tax Rate: {item.tax_rate}%</p> */}
            <p className="text-sm">Category: {item.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
