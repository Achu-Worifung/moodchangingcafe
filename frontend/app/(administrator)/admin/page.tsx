"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection,  onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { ShoppingCart, Package, TrendingUp, Plus } from "lucide-react";
import Loading from "@/app/loading";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    liveOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    ordersThisWeek: 0,
    ordersLastWeek: 0,
    weeklyData: [] as Array<{ day: string; orders: number }>,
  });

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Real-time listener for orders
    const ordersUnsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
      }));

      const liveOrders = orders.filter((o: any) => o.status !== "completed");
      
      // Calculate week ranges
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
      thisWeekStart.setHours(0, 0, 0, 0);
      
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);

      const ordersThisWeek = orders.filter((o: any) => {
        const createdAt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt?.seconds * 1000);
        return createdAt >= thisWeekStart;
      });

      const ordersLastWeek = orders.filter((o: any) => {
        const createdAt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt?.seconds * 1000);
        return createdAt >= lastWeekStart && createdAt < thisWeekStart;
      });

      // Generate weekly data for chart (last 7 days)
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        day.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);
        
        const dayOrders = orders.filter((o: any) => {
          const createdAt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt?.seconds * 1000);
          return createdAt >= day && createdAt < nextDay;
        });

        weeklyData.push({
          day: day.toLocaleDateString('en-US', { weekday: 'short' }),
          orders: dayOrders.length,
        });
      }

      setStats((prev) => ({
        ...prev,
        totalOrders: orders.length,
        liveOrders: liveOrders.length,
        ordersThisWeek: ordersThisWeek.length,
        ordersLastWeek: ordersLastWeek.length,
        weeklyData,
      }));
      setLoading(false);
    });

    // Real-time listener for users
    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats((prev) => ({
        ...prev,
        totalUsers: snapshot.size,
      }));
    });

    // Real-time listener for items
    const itemsUnsub = onSnapshot(collection(db, "items"), (snapshot) => {
      setStats((prev) => ({
        ...prev,
        totalItems: snapshot.size,
      }));
    });

    unsubscribers.push(ordersUnsub, usersUnsub, itemsUnsub);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const orderGrowth = stats.ordersLastWeek > 0 
    ? ((stats.ordersThisWeek - stats.ordersLastWeek) / stats.ordersLastWeek * 100).toFixed(1)
    : stats.ordersThisWeek > 0 ? "100" : "0";

  const adminRoutes = [
    { name: "Live Orders", path: "/admin/liveorders", icon: ShoppingCart, color: "bg-blue-100 text-blue-800" },
    { name: "All Items", path: "/admin/items", icon: Package, color: "bg-green-100 text-green-800" },
    { name: "Add Item", path: "/admin/additem", icon: Plus, color: "bg-purple-100 text-purple-800" },
  ];

  if (loading) {
    return (
      <div className="w-full flex flex-col text-center">
        <Loading />
        <p className="text-2xl font-light">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 w-full mt-14">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Live Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.liveOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{stats.totalItems}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Growth Metric */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Order Growth
            </CardTitle>
            <CardDescription>Compared to last week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {orderGrowth > "0" ? "+" : ""}{orderGrowth}%
            </div>
            <div className="text-sm text-muted-foreground">
              This week: {stats.ordersThisWeek} orders · Last week: {stats.ordersLastWeek} orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders (Last 7 Days)</CardTitle>
            <CardDescription>Daily order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminRoutes.map((route) => (
          <Card
            key={route.path}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(route.path)}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-full ${route.color} flex items-center justify-center mb-2`}>
                <route.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">{route.name}</CardTitle>
              <CardDescription>Manage and view</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}