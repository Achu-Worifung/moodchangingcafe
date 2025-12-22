"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";
import { ItemFormProps } from "@/lib/types";
import { hexToBase64 } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { onSnapshot } from "firebase/firestore";
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
import {db,} from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "@/app/context/authContext";
export default function Item() {
  const pathname = usePathname();
  const id = pathname.split("/").pop();
  const [item, setItem] = useState<ItemFormProps | null>(null);
  const [stock, setStock] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const router = useRouter();
  const[purchasing, setPurchasing] = useState<boolean>(false);
  const {currentUser, userLoggedIn} = useAuth();
  const[purchase, setPurchase] = useState<boolean>(false);


  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function fetchItem() {
      const decodeItemName = decodeURIComponent(id as string);
      try {
        const q = query(
          collection(db, "items"),
          where("name", "==", decodeItemName)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (!items[0]) {
          setIsValid(false);
          return;
        }

        const currentItem = items[0];
        console.log("data from fetchItem:", currentItem);
        setItem(currentItem);
        setStock(currentItem.stock);

        // Real-time stock updates via Firestore listener
        unsubscribe = onSnapshot(doc(db, "items", currentItem.id), (snapshot) => {
          const data = snapshot.data();
          if (!data) return;
          setStock(data.stock ?? 0);
        });
      } catch (error) {
        toast.error("Failed to fetch item details.");
        setIsValid(false);
        console.error("Error fetching item details:", error);
      }
    }

    fetchItem();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id]);

  async function handleAddToCart() {
    if (!item?.name) return;
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
    const index = normalized.findIndex((e) => e.id === item.name);
    if (index >= 0) {
      normalized[index].quantity += qty;
    } else {
      normalized.push({ id: item.name, quantity: qty });
    }
    localStorage.setItem("cart", JSON.stringify(normalized));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success("Item added to cart");
  }
async function handlePurchase() {
  setPurchasing(true);

  if (!userLoggedIn || !currentUser) {
    setSignInDialogOpen(true);
    handleAddToCart();
    setPurchasing(false);
    return;
  }

  try {
    // 1. First, find the item to get its Reference and current stock
    const itemQuery = query(
      collection(db, "items"),
      where("name", "==", item.name)
    );
    const itemSnapshot = await getDocs(itemQuery);

    if (itemSnapshot.empty) {
      throw new Error("Item not found in database.");
    }

    const itemDoc = itemSnapshot.docs[0];
    const itemRef = itemDoc.ref;
    const currentStock = itemDoc.data().stock;

    // 2. Client-side safety check
    if (currentStock < quantity) {
      toast.error("Not enough stock available.");
      setPurchasing(false);
      return;
    }

    // 3. Initialize a Write Batch
    const batch = writeBatch(db);

    // 4. Create the Order Document reference
    const orderRef = doc(collection(db, 'orders'));
    const orderData = {
      userId: currentUser.uid,
      total: item.unitPrice * quantity,
      items: [{
        itemName: item.name,
        quantity: quantity,
        unitPrice: item.unitPrice,
      }],
      email: currentUser.email || "",
      status: 'received',
      taxes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 5. Add both operations to the batch
    batch.set(orderRef, orderData);
    batch.update(itemRef, { stock: currentStock - quantity });

    // 6. Commit the batch
    await batch.commit();

    toast.success("Purchase successful!");
    // router.push("/orders");
    setPurchase(true);

  } catch (error) {
    toast.error("Purchase failed. Please try again.");
    console.error("Error during purchase:", error);
  } finally {
    setPurchasing(false);
  }
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
      {
        purchase && (
          <AlertDialog open={purchase} onOpenChange={setPurchase}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Thank you for your purchase!
              </AlertDialogTitle>
              <AlertDialogDescription>
                We’ll notify you when your order is on the way, so you can pay at the counter.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => router.push("/")}>
                Ok
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
              src={item.img}
              alt={item.name}
              className="mb-4"
            />
            <span className="flex gap-4 mb-4 text-2xl font-light">
              <p className="text-lg font-medium">
                Price: ${item.unitPrice.toFixed(2)}
              </p>
              <p className="text-lg font-medium">Stock: {stock}</p>
            </span>
            <span>
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
                max={item.stock}
              />
              <Button
                disabled={quantity >= item.stock}
                onClick={() => {
                  setQuantity(quantity + 1);
                }}
              >
                +
              </Button>
            </span>
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
                disabled={purchasing}
              >
                {purchasing ? "Purchasing..." : "Buy Now"}
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


