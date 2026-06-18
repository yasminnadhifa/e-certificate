import mongoose from "mongoose";

const GenerateHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    names: [{ type: String, required: true }],
    count: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.GenerateHistory ||
  mongoose.model("GenerateHistory", GenerateHistorySchema);
