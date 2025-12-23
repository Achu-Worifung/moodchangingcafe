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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemFormProps, OrderProps } from "@/lib/types";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export function ShowOrderInfo({
  show,
  data,
  setShow
}: {
  show: boolean;
  data: OrderProps | null;
  setShow: (show: boolean) => void;
}) 
{
  const [newStatus, setNewStatus] = useState(data?.status || "");
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async () => {
    if (!data?.id || newStatus === data?.status) return;
    
    try {
      setUpdating(true);
      const orderRef = doc(db, "orders", data.id);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      setUpdating(false);
      setShow(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      setUpdating(false);
    }
  };

  return (
    <AlertDialog open={show}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Order Details</AlertDialogTitle>
          <AlertDialogDescription>
            Order from {data?.email}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{data?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium text-xs">{data?.userId}</p>
            </div>
          </div>

          {/* Items List */}
          <div>
            <p className="text-sm font-semibold mb-2">Items</p>
            <div className="space-y-2 bg-gray-50 p-2 rounded">
              {data?.items && Array.isArray(data.items) && data.items.length > 0 ? (
                data.items.map((item: any, idx: number) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span>{item.itemName} (x{item.quantity})</span>
                    <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No items</p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium">${((data?.total || 0) - (data?.taxes || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Taxes</span>
              <span className="font-medium">${(data?.taxes || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">${(data?.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
            <div>
              <p className="text-gray-500">Created</p>
              <p>{data?.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Updated</p>
              <p>{data?.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>

          {/* Status Change */}
          <div className="border-t pt-4">
            <label className="text-sm font-semibold mb-2 block">Update Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShow(false)}>Close</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleStatusChange}
            disabled={updating || newStatus === data?.status}
          >
            {updating ? "Updating..." : "Save Status"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
