"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
import { decodeJWT } from "@/lib/auth-util";
import { useAuth } from "@/lib/auth-context";

export function User() {
  const { token } = useAuth();
  const userInfo = token ? decodeJWT(token) : null;
  console.log("User Info:", userInfo);
  const displayName = userInfo ? userInfo.username.split("_")[0] : "Guest";
  return (
    <>
      {token ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="w-8 h-8">
              <AvatarImage src={""} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button className="w-full">Settings</Button>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Button className="w-full">Logout</Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/signin" className="">
          Sign In
        </Link>
      )}
    </>
  );
}
