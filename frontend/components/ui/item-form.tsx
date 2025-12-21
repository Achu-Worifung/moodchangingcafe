"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { ItemFormProps } from "@/lib/types";
import { Item } from "@radix-ui/react-dropdown-menu";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/context/authContext";


import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  DocumentData,
  DocumentReference,
  FieldValue,
  setDoc as firebaseSetDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { doGetUserRole } from "@/lib/auth";

export function ItemForm() {
  const { item } = useParams();
  console.log("Editing item id:", item);
  const [loading, setLoading] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemPrice, setItemPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemStock, setItemStock] = useState("");

  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  // Fetch item details if editing an existing item
  useEffect(() => {
    if (!item) return;

    async function fetchItemDetails() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/item/${item}`);
        if (!res.ok) {
          toast.error("Failed to fetch item details. Please try again.");
          return;
        }
        const data = await res.json();
        setItemName(data.item.name);
        setItemPrice(data.item.unit_price);
        setItemDescription(data.item.description);
        setItemCategory(data.item.category);
        setItemStock(data.item.quantity_in_stock);
        setItemImage(data.item.img);
        console.log("data from fetchItemDetails:", data);
      } catch (error) {
        console.error("Error fetching item details:", error);
        toast.error("Failed to fetch item details.");
      }
    }
    fetchItemDetails();
  }, [item]);

  async function handleSubmit() {
    if (!uid) {
      toast.error("You must be signed in to add items.");
      return;
    }
    if (
      itemName === "" ||
      itemPrice === "" ||
      itemDescription === ""
    ) {
      toast.error("All fields are required.");
      return;
    }
    // validate proper data type
    if (isNaN(Number(itemPrice)) || isNaN(Number(itemStock))) {
      toast.error("Price and stock must be numbers.");
      return;
    }
    setLoading(true);
    try {
      const userRole = await doGetUserRole(uid);
      console.log("User role:", userRole);
      if (userRole !== "admin" && userRole !== "staff") {
        toast.error("You do not have permission to add items.");
        setLoading(false);
        return;
      }
      try {
        await addDoc(collection(db, "items"), {
          name: itemName,
          img: itemImage ? itemImage.name : "",
          unit_price: Number(itemPrice),
          description: itemDescription,
          category: itemCategory,
          stock: Number(itemStock),
          tax: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        toast.success("Item added successfully.");
      } catch (fireErr: any) {
        if (fireErr?.code === "permission-denied") {
          toast.error("Insufficient permissions to add items (Firestore rules).");
        } else {
          toast.error(fireErr?.message ?? "Failed to add item.");
        }
        console.error("Error adding document:", fireErr);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item. Please try again.");
    }
    setLoading(false);
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-start gap-6 p-8 max-w-lg mx-auto my-17.5 w-full">
      <h1 className="text-2xl font-light ">Add New Item</h1>
      <div className="w-full flex flex-col gap-4">
        <Label htmlFor="itemName">Item Name</Label>
        <Input
          id="itemName"
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </div>
      <div className="w-full flex flex-col gap-4">
        <Label htmlFor="itemImage">Item Image</Label>
        <Input
          id="itemImage"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setItemImage(e.target.files[0]);
            }
          }}
        />
      </div>
      <div className="w-full flex flex-col gap-4">
        <Label htmlFor="itemPrice">Item Price</Label>
        <Input
          id="itemPrice"
          type="number"
          value={itemPrice}
          onChange={(e) => setItemPrice(e.target.value)}
        />
      </div>
      <div className="w-full flex flex-col gap-4">
        <Label htmlFor="itemDescription">Item Description</Label>
        <textarea
          id="itemDescription"
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input  w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          rows={4}
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
        />
      </div>
      <div className="w-full flex flex-col gap-4">
        <Label htmlFor="itemStock">Item Stock</Label>
        <Input
          id="itemStock"
          type="text"
          value={itemStock}
          onChange={(e) => setItemStock(e.target.value)}
        />
      </div>
      <Button
        disabled={loading}
        onClick={() => {
          handleSubmit();
        }}
        className="w-full max-w-xs"
      >
        {loading ? "Adding Item..." : "Add Item"}
      </Button>
    </div>
  );
}


