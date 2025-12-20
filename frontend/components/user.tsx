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

export function User() {
  const displayName = "User";
 
  return (
    <>
      {true ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="w-8 h-8 mx-2 cursor-pointer">
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
        <Link href="/signin" className=" px-2 hover:underline underline-offset-2">
          Sign In
        </Link>
      )}
    </>
  );
}

