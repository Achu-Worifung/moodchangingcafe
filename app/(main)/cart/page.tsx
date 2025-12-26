"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/context/authContext";
import { toast } from "sonner";
import Loading from "@/app/loading";
import {
	collection,
	query,
	where,
	getDocs,
	onSnapshot,
	writeBatch,
	doc,
	serverTimestamp,
} from "firebase/firestore";
import { 
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CartEntry = { id: string; quantity: number };
type ItemDoc = {
	id: string;
	name: string;
	unitPrice: number;
	stock: number;
	img?: string;
};

export default function Cartpage() {
	const router = useRouter();
	const { currentUser, userLoggedIn, loading: authLoading } = useAuth();
	const [cart, setCart] = useState<CartEntry[]>([]);
	const [items, setItems] = useState<Record<string, ItemDoc>>({}); // keyed by name
	const [loading, setLoading] = useState<boolean>(true);
	const [signInDialogOpen, setSignInDialogOpen] = useState(false);
	const unsubscribersRef = useRef<Record<string, () => void>>({});

	// Load cart from localStorage
	useEffect(() => {
		const readCart = () => {
			try {
				const raw = localStorage.getItem("cart");
				const parsed = raw ? JSON.parse(raw) : [];
				const arr = Array.isArray(parsed) ? parsed : [];
				const normalized: CartEntry[] = arr.map((entry: any) =>
					entry && typeof entry === "object" && "id" in entry
						? { id: String(entry.id), quantity: Number(entry.quantity ?? 1) }
						: { id: String(entry), quantity: 1 }
				);
				setCart(normalized);
			} catch {
				setCart([]);
			}
		};
		readCart();

		const onCartUpdated = () => readCart();
		// window.addEventListener("cart-updated", onCartUpdated);
		window.addEventListener("storage", (e) => {
			if (e.key === "cart") readCart();
		});
		return () => {
			// window.removeEventListener("cart-updated", onCartUpdated);
		};
	}, []);

	// Fetch item docs for cart names and attach stock listeners
	useEffect(() => {
		let cancelled = false;

		async function hydrateItems() {
			// Cleanup previous listeners
			Object.values(unsubscribersRef.current).forEach((fn) => fn?.());
			unsubscribersRef.current = {};

			if (cart.length === 0) {
				setItems({});
				setLoading(false);
				return;
			}

			try {
				const nextItems: Record<string, ItemDoc> = {};
				for (const entry of cart) {
					const q = query(collection(db, "items"), where("name", "==", entry.id));
					const snapshot = await getDocs(q);
					if (snapshot.empty) {
						// Item may have been removed; keep a placeholder
						nextItems[entry.id] = {
							id: "",
							name: entry.id,
							unitPrice: 0,
							stock: 0,
						};
						continue;
					}
					const docSnap = snapshot.docs[0];
					const data = docSnap.data() as any;
					const itemDoc: ItemDoc = {
						id: docSnap.id,
						name: data.name,
						unitPrice: Number(data.unitPrice ?? 0),
						stock: Number(data.stock ?? 0),
						img: data.img,
					};
					nextItems[itemDoc.name] = itemDoc;

					// Attach stock listener
					const unsubscribe = onSnapshot(doc(db, "items", docSnap.id), (snap) => {
						const updated = snap.data();
						if (!updated) return;
						setItems((prev) => ({
							...prev,
							[itemDoc.name]: {
								...(prev[itemDoc.name] ?? itemDoc),
								stock: Number(updated.stock ?? 0),
								unitPrice: Number(updated.unitPrice ?? itemDoc.unitPrice),
							},
						}));
					});
					unsubscribersRef.current[itemDoc.name] = unsubscribe;
				}

				if (!cancelled) {
					setItems(nextItems);
					setLoading(false);
				}
			} catch (err) {
				console.error("Failed to load cart item details:", err);
				toast.error("Failed to load cart items.");
				setLoading(false);
			}
		}

		setLoading(true);
		hydrateItems();
		return () => {
			cancelled = true;
		};
	}, []);

	const lineItems = useMemo(() => {
		return cart.map((entry) => {
			const item = items[entry.id];
			const price = item?.unitPrice ?? 0;
			const subtotal = price * entry.quantity;
			return {
				name: entry.id,
				quantity: entry.quantity,
				price,
				subtotal,
				stock: item?.stock ?? 0,
				img: item?.img,
			};
		});
	}, [cart, items]);

	const total = useMemo(() => {
		return lineItems.reduce((sum, li) => sum + li.subtotal, 0);
	}, [lineItems]);

	function updateCartQuantity(name: string, nextQty: number) {
		setCart((prev) => {
			const updated = prev.map((e) => (e.id === name ? { ...e, quantity: nextQty } : e));
			localStorage.setItem("cart", JSON.stringify(updated));
			// window.dispatchEvent(new Event("cart-updated"));
			return updated;
		});
	}

	function removeFromCart(name: string) {
		setCart((prev) => {
			const updated = prev.filter((e) => e.id !== name);
			localStorage.setItem("cart", JSON.stringify(updated));
			// window.dispatchEvent(new Event("cart-updated"));
			return updated;
		});
	}

	async function handlePurchaseAll() {
		if (authLoading) return;
		if (!userLoggedIn || !currentUser) {
			setSignInDialogOpen(true);
			return;
		}

		if (cart.length === 0) {
			toast.info("Your cart is empty.");
			return;
		}

		try {
			// Re-validate stock and gather refs
			const refs: Array<{ name: string; ref: any; stock: number; unitPrice: number; qty: number }> = [];
			for (const entry of cart) {
				const q = query(collection(db, "items"), where("name", "==", entry.id));
				const snap = await getDocs(q);
				if (snap.empty) {
					toast.error(`Item ${entry.id} is no longer available.`);
					return;
				}
				const docSnap = snap.docs[0];
				const data = docSnap.data() as any;
				const currentStock = Number(data.stock ?? 0);
				const unitPrice = Number(data.unitPrice ?? 0);
				if (currentStock < entry.quantity) {
					toast.error(`Not enough stock for ${entry.id}. Available: ${currentStock}`);
					return;
				}
				refs.push({ name: entry.id, ref: docSnap.ref, stock: currentStock, unitPrice, qty: entry.quantity });
			}

			const batch = writeBatch(db);
			const orderRef = doc(collection(db, "orders"));
			const itemsPayload = refs.map((r) => ({
				itemName: r.name,
				quantity: r.qty,
				unitPrice: r.unitPrice,
			}));
			const totalCost = refs.reduce((sum, r) => sum + r.unitPrice * r.qty, 0);
			const orderData = {
				userId: currentUser.uid,
				email: currentUser.email || "",
				status: "received",
				taxes: 0,
				total: totalCost,
				items: itemsPayload,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			};
			batch.set(orderRef, orderData);
			refs.forEach((r) => {
				batch.update(r.ref, { stock: r.stock - r.qty });
			});

			await batch.commit();

			toast.success("Purchase successful!");
			// Clear cart
			setCart([]);
			localStorage.removeItem("cart");
			// window.dispatchEvent(new Event("cart-updated"));
			router.push("/orders");
		} catch (err) {
			console.error("Purchase failed:", err);
			toast.error("Purchase failed. Please try again.");
		}
	}

	if (loading) {
		return (
			<div className="w-full flex flex-col text-center">
				<Loading />
				<p className="text-2xl font-light ">Loading cart...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Your Cart</h1>

			{lineItems.length === 0 ? (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
					<p className="text-gray-500 text-lg">Your cart is empty</p>
				</div>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{lineItems.map((li) => (
							<Card key={li.name} className="overflow-hidden">
								<CardHeader className="border-b">
									<CardTitle className="flex items-center justify-between">
										<span className="truncate" title={li.name}>{li.name}</span>
										{li.stock > 0 ? (
											<span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
												{li.stock} in stock
											</span>
										) : (
											<span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
												Out of stock
											</span>
										)}
									</CardTitle>
									<CardDescription>
										Price: ${li.price.toFixed(2)}
									</CardDescription>
								</CardHeader>
								<CardContent className="pt-4">
									{li.img && (
										<img src={li.img} alt={li.name} className="w-full h-36 object-cover rounded mb-4" />
									)}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												disabled={li.quantity <= 1}
												onClick={() => updateCartQuantity(li.name, li.quantity - 1)}
											>
												-
											</Button>
											<span className="w-8 text-center">{li.quantity}</span>
											<Button
												variant="outline"
												size="sm"
												disabled={li.quantity >= li.stock}
												onClick={() => updateCartQuantity(li.name, li.quantity + 1)}
											>
												+
											</Button>
										</div>
										<div className="text-right">
											<div className="text-sm text-muted-foreground">Subtotal</div>
											<div className="font-semibold">${li.subtotal.toFixed(2)}</div>
										</div>
									</div>
								</CardContent>
								<CardFooter className="border-t flex justify-between">
									<Button variant="secondary" size="sm" onClick={() => removeFromCart(li.name)}>
										Remove
									</Button>
									
								</CardFooter>
							</Card>
						))}
					</div>

					<div className="flex justify-between items-center mt-6">
						<div className="text-lg">
							Total: <span className="font-bold">${total.toFixed(2)}</span>
						</div>
						<Button
							variant="destructive"
							onClick={handlePurchaseAll}
							disabled={lineItems.some((li) => li.stock <= 0 || li.quantity > li.stock)}
						>
							Purchase
						</Button>
					</div>
				</>
			)}

			{signInDialogOpen && (
				<AlertDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>You must be signed in to purchase.</AlertDialogTitle>
							<AlertDialogDescription>
								Please sign in to continue with your purchase.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={() => router.push("/signin")}>Sign in</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}
