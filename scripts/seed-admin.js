const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const args = process.argv.slice(2);
const options = {
  username: "admin",
  password: "admin123",
  name: "Administrator",
  limit: 1000,
};

args.forEach((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  const value = rest.join("=");
  if (!key || value === undefined) return;
  if (key === "limit") {
    options.limit = Number(value) || options.limit;
  } else if (key in options) {
    options[key] = value;
  }
});

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI belum diset di .env.local atau environment variables.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
  limit: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI, {});
  console.log("Terhubung ke MongoDB.");

  const hashedPassword = await bcrypt.hash(options.password, 10);

  const existing = await User.findOne({ username: options.username });
  if (existing) {
    existing.name = options.name;
    existing.password = hashedPassword;
    existing.role = "ADMIN";
    existing.limit = Number(options.limit);
    existing.used = 0;
    await existing.save();
    console.log(`Admin existing diperbarui: ${options.username}`);
  } else {
    await User.create({
      name: options.name,
      username: options.username,
      password: hashedPassword,
      role: "ADMIN",
      limit: Number(options.limit),
      used: 0,
    });
    console.log(`Admin baru berhasil dibuat: ${options.username}`);
  }

  await mongoose.disconnect();
  console.log("Selesai.");
}

seedAdmin().catch((error) => {
  console.error("Gagal menjalankan seed admin:", error);
  process.exit(1);
});
