"use client";
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
import { Button } from "./button";
import { toast } from "sonner";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/app/context/authContext";
import { db } from "@/lib/firebase";
import { doGetUserRole } from "@/lib/auth";

export function CloseStore() {
  const { currentUser } = useAuth();
  async function closeStore() {
    const role = await doGetUserRole(currentUser?.uid || "");

    if (!currentUser || !currentUser.uid || role !== "admin") {
      toast.error("You must be logged in to close the store.");
      return;
    }

    try {
      const colRef = collection(db, "items");
      const q = await getDocs(query(colRef));
      const batch = writeBatch(db);

      q.forEach((document) => {
        const docRef = doc(db, "items", document.id);
        batch.update(docRef, {
          stock: 0,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      toast.success("Store closed successfully.");
    } catch (error) {
      console.error("Error closing store:", error);
      toast.error(
        "An error occurred while closing the store. Please try again."
      );
    }
  }
  return (
    <div className="w-full py-4 bg-accent border-2 border-dashed flex items-center justify-between px-6 rounded-lg mb-8">
      <p className="text-md font-light text-2xl">Close the Store</p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="cursor-pointer hover:bg-red-800"
          >
            Close Store
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              You are about to close your store.
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will result in all inventory being cleared and
              customers not being able to place orders. Are you sure you want to
              proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={closeStore}>
              Close Store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
