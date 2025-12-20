"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";
import { ItemFormProps } from "@/lib/types";
import { hexToBase64 } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@lib/auth-context";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Item() {
  const pathname = usePathname();
  const id = pathname.split("/").pop();
  const [item, setItem] = useState<ItemFormProps | null>(null);
  const [stock, setStock] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const { token, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchItem() {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/item/${id}`);
      if (!res.ok) {
        setIsValid(false);
        return;
      }
      const data = await res.json();
      setItem(data.item);
      setStock(data.item.quantity_in_stock);
    }

    function openwebsocket() {
      const socket = new WebSocket(`ws://127.0.0.1:8000/ws/item/${id}`);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStock(data.quantity_in_stock);
        console.log("WebSocket message received:", data);
      };
      socket.onopen = () => {
        console.log("WebSocket connection opened");
      };
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        //reconnect logic could be added here
        socket.close();
        openwebsocket();
      };
      socket.onclose = () => {
        console.log("WebSocket connection closed");
        openwebsocket();
      };
    }
    fetchItem();
    openwebsocket();
  }, [id]);

  async function handleAddToCart() {
    if (!item?.id) return;
    const raw = localStorage.getItem("cart");
    let parsed: any = [];
    try {
      parsed = raw ? JSON.parse(raw) : [];
    } catch {
      parsed = [];
    }
    const arr = Array.isArray(parsed) ? parsed : [];
    // Normalize to objects of shape { id, quantity }
    const normalized = arr.map((entry) =>
      entry && typeof entry === "object" && "id" in entry
        ? entry
        : { id: entry, quantity: 1 }
    );

    const qty =
      Number.isFinite(quantity as unknown as number) && (quantity as number) > 0
        ? (quantity as number)
        : 1;
    const index = normalized.findIndex((e) => e.id === item.id);
    if (index >= 0) {
      normalized[index].quantity += qty;
    } else {
      normalized.push({ id: item.id, quantity: qty });
    }
    localStorage.setItem("cart", JSON.stringify(normalized));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success("Item added to cart");
  }
  async function handlePurchase() {
    if (!isSignedIn || !token) {
      setSignInDialogOpen(true);
      handleAddToCart();
      return;
    }
    const res = await fetch(`http://127.0.0.1:8000/api/singlepurchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ item_id: item.id, quantity: quantity , total: item.unit_price * quantity}),
    });
    if (!res.ok) {
      toast.error("Purchase failed. Please try again.");
      return;
    }
    toast.success("Purchase successful!");
    // router.push("/orders");
  }
  return (
    <div>
      {signInDialogOpen && (
        <AlertDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                You must be signed in to make a purchase.
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please sign in to continue with your purchase.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push("/signin")}>
                Sign in
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isValid ? (
        item ? (
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{item.name}</h1>
            <img
              src={item.img && `data:image/png;base64,${hexToBase64(item.img)}`}
              alt={item.name}
              className="mb-4"
            />
            <span className="flex gap-4 mb-4 text-2xl font-light">
              <p className="text-lg font-medium">
                Price: ${item.unit_price.toFixed(2)}
              </p>
              <p className="text-lg font-medium">Stock: {stock}</p>
            </span>
            <spa>
              <label htmlFor="quantity" className="mr-2 text-lg font-medium">
                Quantity:
              </label>
              <Button
                disabled={quantity <= 1}
                onClick={() => setQuantity(quantity - 1)}
              >
                -
              </Button>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-16 text-center mx-2 border rounded"
                min={1}
                max={item.quantity_in_stock}
              />
              <Button
                disabled={quantity >= item.quantity_in_stock}
                onClick={() => {
                  setQuantity(quantity + 1);
                }}
              >
                +
              </Button>
            </spa>
            <p className="text-lg mb-4">{item.description}</p>
            <span className="w-full flex gap-4 mb-4">
              <Button
                variant="outline"
                className="mr-4 w-1/2 border-2"
                onClick={() => {
                  handleAddToCart();
                  router.push("/");
                }}
              >
                Add to Cart
              </Button>
              <Button
                variant="destructive"
                className="w-1/2"
                onClick={handlePurchase}
              >
                Buy Now
              </Button>
            </span>
          </div>
        ) : (
          <div className="w-full flex flex-col text-center">
            <Loading />
            <p className="text-2xl font-light ">Loading Item...</p>
          </div>
        )
      ) : (
        <p className="text-2xl font-light ">The Item does not exist</p>
      )}
    </div>
  );
}
