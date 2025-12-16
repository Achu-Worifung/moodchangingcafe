import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
export function Cart()
{
    return (
        <Link href="/cart" className='p-1.5 hover:bg-zinc-200 cursor-pointer rounded-full'>
            <ShoppingCart />
        </Link>
    )
}