import Link from "next/link"
export function Logo()
{
    return (
         <Link href="/">
           <span className="text-lg font-light flex items-center text-black">
             <h1>MoodChangingCafe</h1>
           </span>
         </Link>
    )
}