import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { limit, role, used, password } = body;

  if (!id) {
    return NextResponse.json({ error: "User ID tidak valid" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  if (typeof limit === "number") {
    user.limit = limit;
  }
  if (typeof used === "number") {
    user.used = used;
  }
  if (role === "ADMIN" || role === "USER") {
    user.role = role;
  }
  if (typeof password === "string" && password.length >= 6) {
    user.password = await bcrypt.hash(password, 10);
  }

  await user.save();
  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      role: user.role,
      limit: user.limit,
      used: user.used,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();
  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Tidak bisa menghapus akun admin" }, { status: 403 });
  }

  await User.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
