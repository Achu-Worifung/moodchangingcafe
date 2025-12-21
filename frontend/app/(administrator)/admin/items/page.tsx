"use client";
import { useState, useEffect } from "react";
import { ItemForm } from "@/components/ui/item-form";
import { ItemFormProps } from "@/lib/types";
import { toast } from "sonner";
import {ItemTable} from "@/components/ui/item-table";
import Loading from "@/app/loading";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    <>
      {!loading && items && items.length == 0 ? (
        <div>No items found.</div>
      ) : (
        <div className="space-y-8 flex flex-col items-center justify-start p-8 w-full min-h-screen mt-20">
            <h1 className="text-4xl font-bold text-center">View Items</h1>

            <ItemTable data={items} />
        </div>
      )}
    </>
  );
}
