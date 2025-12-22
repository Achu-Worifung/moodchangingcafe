"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loading from "@/app/loading";
export default function EditItemPage() {
  const [items, setItems] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
        const snapshot = await getDocs(collection(db, "items"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(items);
        console.log("Fetched items:", items);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    }
    fetchItems();
    setLoading(false);
  }, []);
     if (loading) {
        return (
          <div>
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
              src={item.img}
              alt={item.name || "Item image"}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {/* <p className="text-sm text-gray-600">{item.description}</p> */}
            <p className="text-sm font-medium mt-2">Price: ${item.unitPrice}</p>
            {/* <p className="text-sm">Stock: {item.quantity_in_stock}</p> */}
            {/* <p className="text-sm">Tax Rate: {item.tax_rate}%</p> */}
            <p className="text-sm">Category: {item.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
