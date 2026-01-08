"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Award,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@ecosystem/ui";
import { toast } from "sonner";

interface CertificationSkill {
  skill: {
    id: string;
    name: string;
  };
}

interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  credentialId: string | null;
  verificationUrl: string | null;
  organizationLogo: string | null;
  category: string;
  displayOrder: number;
  skills: CertificationSkill[];
}

const CATEGORY_LABELS: Record<string, string> = {
  MACHINE_LEARNING: "Machine Learning",
  CLOUD_COMPUTING: "Cloud Computing",
  DATA_ANALYTICS: "Data Analytics",
  WEB_DEVELOPMENT: "Web Development",
  MOBILE_DEVELOPMENT: "Mobile Development",
  DEVOPS: "DevOps",
  CYBERSECURITY: "Cybersecurity",
  DATABASE: "Database",
  OTHER: "Other",
};

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchCertifications();
  }, []);

  async function fetchCertifications() {
    try {
      const response = await fetch("/api/admin/certifications");
      if (!response.ok) throw new Error("Failed to fetch certifications");
      const data = await response.json();
      setCertifications(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load certifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this certification?")) return;

    try {
      const response = await fetch(`/api/admin/certifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete certification");

      toast.success("Certification deleted successfully");
      setCertifications(certifications.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete certification");
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.organization.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || cert.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional certifications
          </p>
        </div>
        <Link href="/dashboard/certifications/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Certification
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search certifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertifications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No certifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertifications.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.displayOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {cert.organizationLogo && (
                            <img
                              src={cert.organizationLogo}
                              alt={cert.organization}
                              className="w-8 h-8 rounded object-contain"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {cert.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {cert.organization}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {CATEGORY_LABELS[cert.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(cert.issueDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cert.skills.slice(0, 3).map((s) => (
                            <Badge key={s.skill.id} variant="outline">
                              {s.skill.name}
                            </Badge>
                          ))}
                          {cert.skills.length > 3 && (
                            <Badge variant="outline">
                              +{cert.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {cert.verificationUrl && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={cert.verificationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Verify
                                </a>
                              </DropdownMenuItem>
                            )}
                            <Link
                              href={`/dashboard/certifications/${cert.id}/edit`}
                            >
                              <DropdownMenuItem>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(cert.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
