"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface ContactClientProps {
  email: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactClient({ email }: ContactClientProps) {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;

    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "landing" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      setState("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section id="contact" className="py-24 px-6 lg:px-8">
      <motion.div
        className="max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={itemVariants} className="text-center mb-4">
          <span className="text-primary font-mono text-lg">
            05. What&apos;s Next?
          </span>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-center"
        >
          Get In Touch
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-muted-foreground text-lg mb-12 leading-relaxed text-center"
        >
          I&apos;m currently open for new opportunities and my inbox is always
          open. Whether you have a question, want to collaborate on a project,
          or just want to say hi, I&apos;ll try my best to get back to you!
        </motion.p>

        {state === "success" ? (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-primary/40 bg-primary/5 p-8 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Message sent!
            </h3>
            <p className="text-muted-foreground mb-6">
              Thanks for reaching out. I&apos;ll get back to you within 24
              hours.
            </p>
            <button
              type="button"
              onClick={() => setState("idle")}
              className="text-sm text-primary hover:underline"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="contact-name"
                  className="text-sm font-medium text-foreground"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="contact-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="contact-message"
                className="text-sm font-medium text-foreground"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Tell me about your project or question..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.message.length}/2000
              </p>
            </div>

            {state === "error" && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
              <a
                href={`mailto:${email}`}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Or email directly: {email}
              </a>
              <button
                type="submit"
                disabled={state === "submitting"}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all text-sm font-medium"
              >
                {state === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </section>
  );
}
