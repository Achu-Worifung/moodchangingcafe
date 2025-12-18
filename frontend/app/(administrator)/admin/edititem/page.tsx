"use client";
import { useState, useEffect } from "react";
import { ItemForm } from "@/components/ui/item-form";
import { ItemFormProps } from "@/lib/types";
import { toast } from "sonner";
import {ItemTable} from "@/components/ui/item-table";
import Loading from "@/app/loading";
export default function EditItemPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ItemFormProps[]>([]);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/admin/items");
        if (!res.ok) {
          toast.error("Failed to fetch items. Please try again.");
        }
        const data = await res.json();
        console.log("Fetched items:", data.items);
        setItems(data.items);
      } catch (e) {
        toast.error("Failed to fetch items. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
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
            <h1 className="text-4xl font-bold text-center">Edit Items</h1>

            <ItemTable data={items} />
        </div>
      )}
    </>
  );
}
