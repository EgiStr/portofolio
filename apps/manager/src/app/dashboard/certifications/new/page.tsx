"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@ecosystem/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/upload/image-upload";
import { FileUpload } from "@/components/upload/file-upload";

interface Skill {
  id: string;
  name: string;
}

const CATEGORY_OPTIONS = [
  { value: "MACHINE_LEARNING", label: "Machine Learning" },
  { value: "CLOUD_COMPUTING", label: "Cloud Computing" },
  { value: "DATA_ANALYTICS", label: "Data Analytics" },
  { value: "WEB_DEVELOPMENT", label: "Web Development" },
  { value: "MOBILE_DEVELOPMENT", label: "Mobile Development" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "CYBERSECURITY", label: "Cybersecurity" },
  { value: "DATABASE", label: "Database" },
  { value: "OTHER", label: "Other" },
];

export default function NewCertificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("OTHER");
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    issueDate: "",
    credentialId: "",
    verificationUrl: "",
    organizationLogo: "",
    certificateFile: "",
    category: "OTHER",
    displayOrder: 0,
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  async function fetchSkills() {
    try {
      const response = await fetch("/api/admin/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load skills");
    }
  }

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      toast.error("Skill name is required");
      return;
    }

    setIsCreatingSkill(true);
    try {
      const response = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSkillName.trim(),
          category: newSkillCategory,
          level: 50,
          order: skills.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create skill");

      const newSkill = await response.json();
      setSkills([...skills, newSkill]);
      setSelectedSkills([...selectedSkills, newSkill.id]);
      setNewSkillName("");
      setNewSkillCategory("OTHER");
      setIsDialogOpen(false);
      toast.success("Skill created successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create skill");
    } finally {
      setIsCreatingSkill(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          skillIds: selectedSkills,
        }),
      });

      if (!response.ok) throw new Error("Failed to create certification");

      toast.success("Certification created successfully");
      router.push("/dashboard/certifications");
    } catch (error) {
      toast.error("Failed to create certification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/dashboard/certifications"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Certifications
        </Link>
        <h1 className="text-3xl font-bold text-foreground">
          Add New Certification
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Certification Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="AWS Certified Solutions Architect"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) =>
                      handleChange("organization", e.target.value)
                    }
                    placeholder="Amazon Web Services"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) =>
                        handleChange("issueDate", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentialId">Credential ID</Label>
                    <Input
                      id="credentialId"
                      value={formData.credentialId}
                      onChange={(e) =>
                        handleChange("credentialId", e.target.value)
                      }
                      placeholder="ABC123XYZ"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationUrl">Verification URL</Label>
                  <Input
                    id="verificationUrl"
                    type="url"
                    value={formData.verificationUrl}
                    onChange={(e) =>
                      handleChange("verificationUrl", e.target.value)
                    }
                    placeholder="https://verify.example.com/cert/123"
                  />
                </div>

                <ImageUpload
                  value={formData.organizationLogo}
                  onChange={(url) => handleChange("organizationLogo", url)}
                  bucket="avatars"
                  label="Organization Logo"
                  aspectRatio="square"
                />

                <FileUpload
                  value={formData.certificateFile}
                  onChange={(url) => handleChange("certificateFile", url)}
                  bucket="certificates"
                  label="Certificate File (PDF or Image)"
                  maxSize={10}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Related Skills</CardTitle>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        New Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Skill</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="skillName">Skill Name</Label>
                          <Input
                            id="skillName"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            placeholder="e.g., Python, React, AWS"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skillCategory">Category</Label>
                          <Select
                            value={newSkillCategory}
                            onValueChange={setNewSkillCategory}
                          >
                            <SelectTrigger id="skillCategory">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LANGUAGE">Language</SelectItem>
                              <SelectItem value="FRAMEWORK">
                                Framework
                              </SelectItem>
                              <SelectItem value="DATABASE">Database</SelectItem>
                              <SelectItem value="DEVOPS">DevOps</SelectItem>
                              <SelectItem value="TOOL">Tool</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreateSkill}
                          disabled={isCreatingSkill}
                          className="w-full"
                        >
                          {isCreatingSkill ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Skill
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {skills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => toggleSkill(skill.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{skill.name}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category & Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      handleChange("displayOrder", parseInt(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Certification
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
