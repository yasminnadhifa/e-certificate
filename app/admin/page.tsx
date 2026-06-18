import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  await connectDB();
  const totalUsers = await User.countDocuments();
  const totalUsedResult = await User.aggregate([
    { $group: { _id: null, total: { $sum: "$used" } } },
  ]);
  const totalUsed = totalUsedResult[0]?.total ?? 0;

  return <AdminDashboard totalUsers={totalUsers} totalUsed={totalUsed} />;
}
