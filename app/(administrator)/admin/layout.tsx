"use client";
import { AdminNavBar } from "@/components/admin-nav";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { doGetUserRole } from "@/lib/auth";
import { useAuth } from "@/app/context/authContext";
import Loading from "@/app/loading";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { currentUser, userLoggedIn, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) {
        return;
      }

      if (!userLoggedIn || !currentUser?.uid) {
        console.log('user not logged in, redirecting to home page');
        router.push("/");
        return;
      }

      const role = await doGetUserRole(currentUser.uid);
      console.log("Admin Layout - User Role:", role, "User Logged In:", userLoggedIn);
      
      if (role !== "admin") {
        console.log('user not admin, redirecting to home page. Role:', role);
        router.push("/");
      } else {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [userLoggedIn, currentUser?.uid, router, authLoading]);
  return (
    <>
      {loading ? (
        <>
          <Loading />
          <p className="w-full text-center font-2xl">Loading...</p>
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center flex-col gap-8 relative">
          <AdminNavBar />
          {children}
        </div>
      )}
    </>
  );
}
