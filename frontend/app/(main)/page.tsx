'use client';
import Image from "next/image";
import { toast } from "sonner";
import {useState, useEffect} from "react";
import {ItemFormProps} from "../lib/types";
import { useRouter } from 'next/navigation';
export default function Home() {
  const [items, setItems] = useState<ItemFormProps[] | null>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("http://127.0.0.1:8000/api/items");
      if (!res.ok) {
        toast.error("Failed to fetch items. Please try again.");
        return;
      }
      const data = await res.json();
      setItems(data.items);
      console.log("Fetched items:", data.items);
    }
    fetchData();
  }, []);

  function hexToBase64(hex) {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items && items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow ease-in-out"
          onClick={() => router.push(`/item/${item.id}`)} >
            <img
              src={ item.img && `data:image/png;base64,${hexToBase64(item.img)}`}
              alt={item.name || "Item image"}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {/* <p className="text-sm text-gray-600">{item.description}</p> */}
            <p className="text-sm font-medium mt-2">Price: ${item.unit_price.toFixed(2)}</p>
            {/* <p className="text-sm">Stock: {item.quantity_in_stock}</p> */}
            {/* <p className="text-sm">Tax Rate: {item.tax_rate}%</p> */}
            <p className="text-sm">Category: {item.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
