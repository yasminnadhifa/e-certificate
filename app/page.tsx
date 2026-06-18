import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CertificateGenerator from "@/components/CertificateGenerator";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findOne({ username: session.user.email }).lean();
  if (!user) {
    redirect("/login");
  }

  return (
    <CertificateGenerator
      user={{
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
        limit: user.limit,
        used: user.used,
      }}
    />
  );
}
