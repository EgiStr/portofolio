"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@ecosystem/ui";
import { Button, Input, Label, Textarea } from "@ecosystem/ui";
import {
  Save,
  User,
  Globe,
  Bell,
  Layout,
  FileText,
  Briefcase,
  Code,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/upload/image-upload";

type Tab = "profile" | "landing" | "blog" | "social" | "seo";

interface Settings {
  // Profile
  name: string;
  email: string;
  bio: string;
  avatar: string;
  location: string;
  phone: string;

  // Landing Page
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutTitle: string;
  aboutDescription: string;
  resumeUrl: string;

  // Blog
  blogTitle: string;
  blogDescription: string;
  postsPerPage: number;
  showReadingTime: boolean;
  showViewCount: boolean;

  // Social Links
  twitter: string;
  github: string;
  linkedin: string;
  instagram: string;
  youtube: string;

  // SEO
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;
  googleAnalyticsId: string;
}

const defaultSettings: Settings = {
  name: "Eggi Satria",
  email: "eggisatria2310@gmail.com",
  bio: "Full Stack Developer passionate about building exceptional digital experiences.",
  avatar: "",
  location: "Indonesia",
  phone: "081302691577",

  heroTitle: "Hi, I'm Eggi",
  heroSubtitle: "Full Stack Developer",
  heroDescription:
    "I build things for the web. Specializing in creating exceptional digital experiences that are fast, accessible, and beautiful.",
  aboutTitle: "About Me",
  aboutDescription:
    "A passionate developer with experience in building modern web applications.",
  resumeUrl: "",

  blogTitle: "Blog",
  blogDescription: "Thoughts on software development, design, and technology.",
  postsPerPage: 10,
  showReadingTime: true,
  showViewCount: true,

  twitter: "@egistr",
  github: "EgiStr",
  linkedin: "eggisatria",
  instagram: "@_egistr",
  youtube: "eggisatria",

  siteTitle: "Eggi Satria | Full Stack Developer",
  siteDescription:
    "Full Stack Developer specializing in building exceptional digital experiences.",
  siteKeywords: "developer, full stack, react, nextjs, typescript",
  ogImage: "",
  googleAnalyticsId: "",
};

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  {
    id: "landing",
    label: "Landing Page",
    icon: <Layout className="w-4 h-4" />,
  },
  { id: "blog", label: "Blog", icon: <FileText className="w-4 h-4" /> },
  { id: "social", label: "Social", icon: <Globe className="w-4 h-4" /> },
  { id: "seo", label: "SEO & Meta", icon: <Code className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(key: keyof Settings, value: string | number | boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage all your site configurations and preferences
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                value={settings.avatar}
                onChange={(url) => handleChange("avatar", url)}
                bucket="avatars"
                label="Profile Photo"
                aspectRatio="square"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={settings.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="A short bio about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={settings.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="City, Country"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+62 xxx"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Landing Page Tab */}
      {activeTab === "landing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input
                    id="heroTitle"
                    value={settings.heroTitle}
                    onChange={(e) => handleChange("heroTitle", e.target.value)}
                    placeholder="Hi, I'm..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Input
                    id="heroSubtitle"
                    value={settings.heroSubtitle}
                    onChange={(e) =>
                      handleChange("heroSubtitle", e.target.value)
                    }
                    placeholder="Full Stack Developer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heroDescription">Hero Description</Label>
                <Textarea
                  id="heroDescription"
                  value={settings.heroDescription}
                  onChange={(e) =>
                    handleChange("heroDescription", e.target.value)
                  }
                  placeholder="What you do..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                About Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aboutTitle">About Title</Label>
                <Input
                  id="aboutTitle"
                  value={settings.aboutTitle}
                  onChange={(e) => handleChange("aboutTitle", e.target.value)}
                  placeholder="About Me"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutDescription">About Description</Label>
                <Textarea
                  id="aboutDescription"
                  value={settings.aboutDescription}
                  onChange={(e) =>
                    handleChange("aboutDescription", e.target.value)
                  }
                  placeholder="Tell your story..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeUrl">Resume/CV URL</Label>
                <Input
                  id="resumeUrl"
                  type="url"
                  value={settings.resumeUrl}
                  onChange={(e) => handleChange("resumeUrl", e.target.value)}
                  placeholder="https://example.com/resume.pdf"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === "blog" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Blog Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blogTitle">Blog Title</Label>
                  <Input
                    id="blogTitle"
                    value={settings.blogTitle}
                    onChange={(e) => handleChange("blogTitle", e.target.value)}
                    placeholder="My Blog"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postsPerPage">Posts Per Page</Label>
                  <Input
                    id="postsPerPage"
                    type="number"
                    min={1}
                    max={50}
                    value={settings.postsPerPage}
                    onChange={(e) =>
                      handleChange(
                        "postsPerPage",
                        parseInt(e.target.value) || 10,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blogDescription">Blog Description</Label>
                <Textarea
                  id="blogDescription"
                  value={settings.blogDescription}
                  onChange={(e) =>
                    handleChange("blogDescription", e.target.value)
                  }
                  placeholder="What your blog is about..."
                  rows={2}
                />
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium text-foreground mb-4">
                  Display Options
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Show Reading Time
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Display estimated reading time on posts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showReadingTime}
                      onChange={(e) =>
                        handleChange("showReadingTime", e.target.checked)
                      }
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Show View Count
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Display view count on posts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showViewCount}
                      onChange={(e) =>
                        handleChange("showViewCount", e.target.checked)
                      }
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={settings.twitter}
                    onChange={(e) => handleChange("twitter", e.target.value)}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={settings.github}
                    onChange={(e) => handleChange("github", e.target.value)}
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={settings.linkedin}
                    onChange={(e) => handleChange("linkedin", e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={settings.instagram}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={settings.youtube}
                  onChange={(e) => handleChange("youtube", e.target.value)}
                  placeholder="Channel URL or @handle"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                SEO & Meta Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => handleChange("siteTitle", e.target.value)}
                  placeholder="Your Site Title"
                />
                <p className="text-xs text-muted-foreground">
                  Used in browser tabs and search results
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Meta Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    handleChange("siteDescription", e.target.value)
                  }
                  placeholder="A brief description of your site..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Keep it under 160 characters for best SEO
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteKeywords">Keywords</Label>
                <Input
                  id="siteKeywords"
                  value={settings.siteKeywords}
                  onChange={(e) => handleChange("siteKeywords", e.target.value)}
                  placeholder="developer, react, nextjs, ..."
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords
                </p>
              </div>

              <ImageUpload
                value={settings.ogImage}
                onChange={(url) => handleChange("ogImage", url)}
                bucket="avatars"
                folder="og"
                label="Open Graph Image"
                aspectRatio="video"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x630px. Used when sharing on social media.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={settings.googleAnalyticsId}
                  onChange={(e) =>
                    handleChange("googleAnalyticsId", e.target.value)
                  }
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-border">
        <Button size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
