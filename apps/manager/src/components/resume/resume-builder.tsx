"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@ecosystem/ui";
import { Loader2, Sparkles, Download, Printer, FileText } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { generateResumeMarkdown } from "@/lib/resume-generator";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { ResumeProps } from "@/types/resume";
import { polishResumeItemAction } from "@/actions/polish-resume";

interface ResumeBuilderProps extends Omit<ResumeProps, "polishedData"> {}

export function ResumeBuilder({
  user,
  experiences: initialExp,
  projects,
  skills,
  siteConfig,
}: ResumeBuilderProps) {
  const [polishedData, setPolishedData] = useState<Record<string, string[]>>(
    {},
  );
  const [markdownContent, setMarkdownContent] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);

  // Initialize markdown on load
  useEffect(() => {
    const initialMarkdown = generateResumeMarkdown({
      user,
      experiences: initialExp,
      projects,
      skills,
      siteConfig,
      polishedData: {},
    });
    setMarkdownContent(initialMarkdown);
  }, [user, initialExp, projects, skills, siteConfig]);

  // Update markdown when polished data changes
  useEffect(() => {
    if (Object.keys(polishedData).length > 0) {
      const newMarkdown = generateResumeMarkdown({
        user,
        experiences: initialExp,
        projects,
        skills,
        siteConfig,
        polishedData,
      });
      setMarkdownContent(newMarkdown);
    }
  }, [polishedData, user, initialExp, projects, skills, siteConfig]);

  const handlePolishExperiences = async () => {
    setIsPolishing(true);
    const newPolishedData = { ...polishedData };
    let count = 0;

    try {
      for (const exp of initialExp) {
        if (newPolishedData[exp.id] || !exp.description) continue;
        const polished = await polishResumeItemAction(exp.description);
        if (polished && polished.length > 0) {
          newPolishedData[exp.id] = polished;
          count++;
        }
      }

      setPolishedData(newPolishedData);
      if (count > 0) toast.success(`Polished ${count} items!`);
      else toast.info("No new items to polish.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to polish content.");
    } finally {
      setIsPolishing(false);
    }
  };

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Resume-${user.name.replace(/\s+/g, "-").toLowerCase()}`,
    onAfterPrint: () => toast.success("Print action completed"),
  });

  const handleDownloadMd = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-${user.name.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    const element = componentRef.current;
    if (!element) return;

    try {
      toast.info("Generating PDF...");
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `resume-${user.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "portrait" as const,
        },
      };
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded!");
    } catch (err) {
      console.error("PDF Generation failed", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
        <div>
          <h2 className="text-lg font-semibold">Resume Editor</h2>
          <p className="text-sm text-muted-foreground">
            Edit in Markdown, Preview, and Download PDF
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadMd}>
            <FileText className="w-4 h-4 mr-2" />
            Download .md
          </Button>
          <Button
            variant="secondary"
            onClick={handlePolishExperiences}
            disabled={isPolishing}
          >
            {isPolishing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
            )}
            AI Polish
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Editor Column */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card">
          <div className="p-3 border-b bg-muted/30 font-medium text-sm">
            Markdown Source
          </div>
          <textarea
            className="flex-1 w-full p-4 resize-none bg-transparent font-mono text-sm focus:outline-none"
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Preview Column */}
        <div className="flex-1 flex flex-col border rounded-lg bg-muted/10 overflow-hidden">
          <div className="p-3 border-b bg-muted/20 text-muted-foreground font-medium text-sm flex justify-between">
            <span>Preview</span>
            <span className="text-xs">A4 Print View</span>
          </div>
          <div className="flex-1 overflow-auto bg-white" ref={componentRef}>
            <div className="print-container p-8">
              <MarkdownPreview content={markdownContent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
