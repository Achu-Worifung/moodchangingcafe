import { Logo } from "./logo";
import { Cart } from "./cart";
import { User } from "@components/user";

export function Navbar()
{
    return (
        <div className="w-full flex items-center justify-between shadow-md py-2 ">
            <span className="hidden sm:block"></span>
            <Logo />
            <span className="flex  gap-1.5 items-center justify-center">
                <Cart />
                <User />
            </span>
        </div>
    )
}