"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function AdminNavBar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-full flex absolute top-0 py-3 items-center justify-between px-6 bg-white shadow-md rounded-xl flex-col sm:flex-row gap-4">
      <span className="text-lg font-light flex items-center text-black w-full justify-between sm:w-fit">
        <h1>MoodChangingCafe | Admin</h1>
        <div
          className="sm:hidden cursor-pointer hover:bg-accent p-2 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </div>
      </span>
      <span className="hidden sm:block">
        <ul className=" gap-4 [&>li]:list-none hidden sm:flex">
          <li>
            <Link href="/admin" className="hover:underline underline-offset-2 ">
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/admin/items"
              className="hover:underline underline-offset-2 "
            >
              Items
            </Link>
          </li>
          <li>
            <Link
              href="/admin/liveorders"
              className="hover:underline underline-offset-2 "
            >
              Orders
            </Link>
          </li>
          
        </ul>
      </span>
      <div className={`sm:hidden w-full ${isOpen ? "block" : "h-0 hidden "} `} >
          {isOpen && (
            <ul className=" gap-4 [&>li]:list-none flex flex-col">
              <li>
                <Link
                  href="/admin"
                  className="hover:underline underline-offset-2 "
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/items"
                  className="hover:underline underline-offset-2 "
                >
                  Items
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/liveorders"
                  className="hover:underline underline-offset-2 "
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/add-item"
                  className="hover:underline underline-offset-2 "
                >
                  New Item
                </Link>
              </li>
            </ul>
          )}
        </div>
      <span className="hidden md:block"></span>
    </div>
  );
}
