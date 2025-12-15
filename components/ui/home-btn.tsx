'use client';
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
export function HomeBtn()
{
    const router = useRouter();
    return (
         <Button className="absolute top-10 left-2 group cursor-pointer" variant='outline' onClick={() => router.push('/')} >
        <MoveLeft className="group-hover:translate-x-2 duration-300"/> Go Home
    </Button>
    )
}