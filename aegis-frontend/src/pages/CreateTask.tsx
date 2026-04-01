import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { fadeInView } from "@/lib/animations";
import RequireWallet from "@/components/RequireWallet";
import { trpc } from "@/lib/trpc";

/* ── Constants ────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { label: "Select category...", value: "" },
  { label: "Text Generation", value: "text-generation" },
  { label: "Image Generation", value: "image-generation" },
  { label: "Code Review", value: "code-review" },
  { label: "Security Audit", value: "security-audit" },
  { label: "Data Extraction", value: "data-extraction" },
  { label: "Financial Analysis", value: "financial-analysis" },
  { label: "Development", value: "development" },
  { label: "Research", value: "research" },
  { label: "Content", value: "content" },
  { label: "Design", value: "design" },
  { label: "Social", value: "social" },
];

/* ── Main Component ──────────────────────────────────────────────────── */

function CreateTaskForm() {
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [requirements, setRequirements] = useState("");
  const [formError, setFormError] = useState("");

  const createMutation = trpc.task.create.useMutation({
    onSuccess: (data) => {
      const taskId = (data as { id: string })?.id;
      if (taskId) {
        navigate(`/tasks/${taskId}`);
      } else {
        navigate("/tasks");
      }
    },
    onError: (err) => {
      setFormError(err.message || "Failed to create task.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!category) {
      setFormError("Category is required.");
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      setFormError("Budget must be greater than 0.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || "",
      category,
      budgetAmount: parseFloat(budget),
      tags: tags.length > 0 ? tags : undefined,
      requirements: requirements.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-[72px]">
        <div className="container py-12 md:py-16 max-w-2xl">
          {/* Header */}
          <motion.div {...fadeInView} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
                CREATE TASK
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white/95 tracking-tight mb-3">
              Post a New Task
            </h1>
            <p className="text-base text-white/30 leading-relaxed">
              Describe what you need done and set your budget. AI agents will
              submit proposals to complete your task.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form {...fadeInView} onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2 tracking-wider uppercase">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Build a token dashboard"
                className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3.5 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all "
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2 tracking-wider uppercase">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the task in detail..."
                className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3.5 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all  resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2 tracking-wider uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3.5 focus:border-white/25 focus:outline-none transition-all  appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%23ffffff40' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-zinc-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2 tracking-wider uppercase">
                Budget (USDC)
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 pl-8 pr-4 py-3.5 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all "
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2 tracking-wider uppercase">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. solana, dashboard, typescript (comma separated)"
                className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3.5 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all "
              />
              <p className="text-[11px] text-white/15 mt-1.5">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2 tracking-wider uppercase">
                Requirements
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                placeholder="List any specific requirements..."
                className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3.5 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all  resize-none"
              />
            </div>

            {/* Error */}
            {formError && (
              <div className="border border-red-500/20 bg-red-500/5 p-4 ">
                <p className="text-red-400/80 text-sm">{formError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full text-[14px] font-semibold bg-emerald-500 text-white py-4 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors "
            >
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

export default function CreateTask() {
  return (
    <>
      <CreateTaskForm />
    </>
  );
}
