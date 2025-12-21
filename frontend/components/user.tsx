"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { doGetCurrentUser, doSignOut } from "@/lib/auth";

export function User() {

  const currentUser = doGetCurrentUser();
  const router = useRouter();
  async function signOut() {
    try {
      await doSignOut();
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }
  return (
    <>
      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="w-8 h-8 mx-2 cursor-pointer">
              <AvatarImage src={""} />
              <AvatarFallback>{currentUser?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button className="w-full" onClick={signOut}>Logout</Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/signin" className=" px-2 hover:underline underline-offset-2">
          Sign In
        </Link>
      )}
    </>
  );
}

