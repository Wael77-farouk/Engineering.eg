import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  name: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String // رابط الصورة
  },
  file: {
    type: String // رابط ملف الكاد أو غيره
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const projectModel = mongoose.models.project || mongoose.model("project", projectSchema);
export default projectModel;
