import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import GenerateHistory from "@/models/GenerateHistory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ username: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const scope = new URL(request.url).searchParams.get("scope");
  let filter: { userId: typeof user._id } | {} = { userId: user._id };

  if (isAdmin) {
    filter = scope === "me" ? { userId: user._id } : {};
  }

  const history = await GenerateHistory.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ history });
}
