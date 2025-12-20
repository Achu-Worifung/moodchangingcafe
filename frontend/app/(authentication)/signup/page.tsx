"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (email === "" || password === "" || confirmPassword === "") {
      toast.error("All fields are required.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Firebase user created:", user);

      // Attempt to create the user profile in Firestore. If this fails or times out,
      // proceed with signup and show a warning so the UI doesn't get stuck.
      try {
        const write = setDoc(doc(db, "users", user.uid), {
          name,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("firestore-timeout")), 8000)
        );

        await Promise.race([write, timeout]);
      } catch (err: unknown) {
        console.warn("Firestore profile write skipped:", err);
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? (err as { code?: string }).code
            : undefined;
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message
            : undefined;

        if (code === "permission-denied") {
          toast.warning(
            "Account created, but profile write blocked by Firestore rules."
          );
        } else if (message === "firestore-timeout") {
          toast.warning("Account created, but saving profile timed out.");
        } else {
          toast.warning("Account created, but failed to save profile.");
        }
      }

      toast.success("Account created successfully!");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);

      // Check if it's a FirebaseError
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            toast.error(
              "Email is already in use. Please use a different email."
            );
            break;
          case "auth/invalid-email":
            toast.error("Invalid email address.");
            break;
          case "auth/weak-password":
            toast.error(
              "Password is too weak. Please use a stronger password."
            );
            break;
          case "auth/operation-not-allowed":
            toast.error(
              "Email/password accounts are not enabled. Please contact support."
            );
            break;
          default:
            toast.error("An error occurred during signup. Please try again.");
        }
      } else {
        // Handle non-Firebase errors
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a new account</CardTitle>
        <CardDescription>
          Enter your details below to create your account
        </CardDescription>
        <CardAction>
          <Button variant="link" onClick={() => router.push("/signin")}>
            Sign In
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </CardFooter>
    </Card>
  );
}
