"use client";

import { useState, useEffect, use } from "react";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "LANGUAGE",
  "FRAMEWORK",
  "DATABASE",
  "DEVOPS",
  "TOOL",
  "OTHER",
];

interface EditSkillPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSkillPage({ params }: EditSkillPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "OTHER",
    level: 50,
    order: 0,
  });

  useEffect(() => {
    fetchSkill();
  }, [resolvedParams.id]);

  async function fetchSkill() {
    try {
      const response = await fetch(`/api/admin/skills/${resolvedParams.id}`);
      if (!response.ok) throw new Error("Failed to fetch skill");
      const data = await response.json();
      setFormData({
        name: data.name,
        category: data.category,
        level: data.level,
        order: data.order,
      });
    } catch (error) {
      toast.error("Failed to load skill");
      router.push("/dashboard/skills");
    } finally {
      setIsLoading(false);
    }
  }

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/skills/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update skill");

      toast.success("Skill updated successfully");
      router.push("/dashboard/skills");
    } catch (error) {
      toast.error("Failed to update skill");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/skills"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Skills
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Edit Skill</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Skill Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="React, TypeScript, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    handleChange("order", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="level">
                  Proficiency Level ({formData.level}%)
                </Label>
              </div>
              <input
                type="range"
                id="level"
                min="0"
                max="100"
                value={formData.level}
                onChange={(e) =>
                  handleChange("level", parseInt(e.target.value))
                }
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Skill
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
