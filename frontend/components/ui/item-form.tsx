"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { ItemFormProps } from "@/lib/types";
import { Item } from "@radix-ui/react-dropdown-menu";
import { useParams } from "next/navigation";

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
  const [categories, setCategories] = useState([
    "Beverages",
    "Snacks",
    "Desserts",
    "Main Course",
    "Appetizers",
  ]);
  const [filteredCategories, setFilteredCategories] = useState(categories);
  console.log(
    "here are the item form props:",
    itemName,
    itemImage,
    itemPrice,
    itemDescription,
    itemCategory,
    itemStock
  );


  if (item) {
    async function fetchItemDetails() {
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
    }
    fetchItemDetails();
  }

  const [categoryFocus, setCategoryFocus] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const handleAddCategory = () => {
    if (newCategory.trim() === "") {
      toast.error("Category name cannot be empty.");
      return;
    }
    if (categories.includes(newCategory)) {
      toast.error("Category already exists.");
      return;
    }
    setCategories([...categories, newCategory]);
    setItemCategory(newCategory);
    setNewCategory("");
    toast.success("Category added successfully.");
  };

  function handleFilterCategory(e: React.ChangeEvent<HTMLInputElement>) {
    const filterValue = e.target.value;
    const filtered = categories.filter((category) =>
      category.toLowerCase().includes(filterValue.toLowerCase())
    );
    setItemCategory(e.target.value);
    setFilteredCategories(filtered);
  }

  const handleDeleteCategory = (category: string) => {
    setCategories(categories.filter((cat) => cat !== category));
    toast.success("Category deleted successfully.");
  };

  async function handleSubmit() {
    if (
      itemName === "" ||
      itemPrice === "" ||
      itemDescription === "" ||
      itemCategory === ""
    ) {
      console.log("categories:", itemCategory);
      console.log(
        itemName,
        itemImage,
        itemPrice,
        itemDescription,
        itemCategory,
        itemStock
      );
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
    formData.append("itemName", itemName.toLowerCase());
    formData.append("itemPrice", itemPrice);
    formData.append("itemDescription", itemDescription);
    formData.append("category", itemCategory);
    formData.append("itemStock", itemStock);
    if (itemImage) {
      formData.append("img", itemImage);
    }
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    const response = await fetch("http://127.0.0.1:8000/api/admin/additem", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      <div className="w-full flex flex-col gap-4 relative">
        <Label htmlFor="itemCategory">Item Category</Label>
        <Input
          id="itemCategory"
          onFocus={() => setCategoryFocus(true)}
          onBlur={() => setCategoryFocus(false)}
          type="text"
          onChange={(e) => handleFilterCategory(e)}
          value={itemCategory}
          placeholder="Select or type to filter categories"
        ></Input>
        {categoryFocus && (
          <div className="absolute z-10 top-16 left-0 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md shadow-md w-full max-h-48 overflow-y-auto">
            {filteredCategories.map((category) => (
              <div
                key={category}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onMouseDown={() => setItemCategory(category)}
                onPointerDown={() => setItemCategory(category)}
              >
                {category}
              </div>
            ))}
            <div
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onMouseDown={handleAddCategory}
              onPointerDown={handleAddCategory}
            >
              Add New Category
            </div>
          </div>
        )}
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
