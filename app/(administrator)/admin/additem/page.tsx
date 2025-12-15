"use client";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddItemPage() {
  const [loading, setLoading] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemPrice, setItemPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemStock, setItemStock] = useState("");
  async function handleSubmit() {
    if (
      itemName === "" ||
      !itemImage ||
      itemPrice === "" ||
      itemDescription === "" ||
      itemCategory === ""
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
    const formData = new FormData();
    formData.append("itemName", itemName);
    formData.append("itemImage", itemImage);
    formData.append("itemPrice", itemPrice);
    formData.append("itemDescription", itemDescription);
    formData.append("itemCategory", itemCategory);
    formData.append("itemStock", itemStock);
    const response = await fetch("/api/admin/additem", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      toast.success("Item added successfully!");
      setItemName("");
      setItemImage(null);
      setItemPrice("");
      setItemDescription("");
      setItemCategory("");
      setItemStock("");
    } else {
      toast.error("Failed to add item.");
    }
    setLoading(false);
  }

  const categories = [
    "Beverages",
    "Snacks",
    "Desserts",
    "Main Course",
    "Appetizers",
  ];
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
        <Label htmlFor="itemCategory">Item Category</Label>
        <Select>
          <SelectTrigger className="w-full">
            <input type="text" value={itemCategory}></input>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  onClick={() => setItemCategory(category)}
                >
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full flex flex-col gap-4">
        <Label htmlFor="itemPrice">Item Price</Label>
        <Input
          id="itemPrice"
          type="text"
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
