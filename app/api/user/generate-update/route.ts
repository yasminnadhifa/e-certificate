import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import GenerateHistory from "@/models/GenerateHistory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count = 1, names = [] } = await req.json();

  await connectDB();
  const user = await User.findOne({ username: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && user.used + count > user.limit) {
    return NextResponse.json({ error: "Limit tercapai!" }, { status: 403 });
  }

  user.used += count;
  await user.save();

  await GenerateHistory.create({
    userId: user._id,
    userName: user.name,
    names,
    count,
  });

  return NextResponse.json({ success: true, used: user.used });
}
