import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [stockUpdates, setStockUpdates] = useState({});

  useEffect(() => {
    async function fetchItems() {
      const res = await fetch("http://127.0.0.1:8000/api/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    }

    fetchItems();

    // Establish WebSocket connection for stock tracking
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/stock");

    socket.onmessage = (event) => {
      const stockUpdate = JSON.parse(event.data);
      setStockUpdates((prev) => ({ ...prev, [stockUpdate.itemId]: stockUpdate.stock }));
    };

    return () => {
      socket.close();
    };
  }, []);

  function handleBuyNow(itemId) {
    // Implement Buy Now functionality
    alert(`Buy Now clicked for item ${itemId}`);
  }

  function handleAddToCart(itemId) {
    // Implement Add to Cart functionality
    alert(`Add to Cart clicked for item ${itemId}`);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow ease-in-out"
            onClick={() => router.push(`/items/${item.id}`)}
          >
            <img
              src={item.img && `data:image/png;base64,${hexToBase64(item.img)}`}
              alt={item.name || "Item image"}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-semibold">{item.name}</h2>
            <p className="text-sm font-medium mt-2">Price: ${item.unit_price.toFixed(2)}</p>
            <p className="text-sm">Category: {item.category}</p>
            <p className="text-sm text-gray-600">
              Stock: {stockUpdates[item.id] ?? item.quantity_in_stock}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyNow(item.id);
                }}
              >
                Buy Now
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item.id);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function hexToBase64(hex) {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}