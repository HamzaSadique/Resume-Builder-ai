import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: "" },
  position: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  isCurrent: { type: Boolean, default: false },
  bullets: [{ type: String }],
});

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  degree: { type: String, default: "" },
  fieldOfStudy: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  techStack: { type: String, default: "" },
  link: { type: String, default: "" },
  bullets: [{ type: String }],
});

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled Resume",
      trim: true,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },
    templateId: {
      type: String,
      default: "standard_ats_v1",
    },

    personalInfo: {
      fullName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    summary: { type: String, default: "" },
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    skills: [{ type: String }],

    // Dynamic ATS Analysis Results
    atsScore: { type: Number, default: 0 },
    missingKeywords: [{ type: String }],
  },
  { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;