"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { importProject } from "@/app/dashboard/actions";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add brief files
    for (const f of briefFiles) {
      formData.append("briefs", f);
    }

    startTransition(async () => {
      const res = await importProject(formData);
      setResult(res);
      if (res.success) {
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import projektu</h1>
        <p className="text-muted-foreground">
          Zaimportuj dane z pipeline klasteryzacji (CSV + briefe MD)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projekt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                Nazwa projektu
              </label>
              <Input
                id="name"
                name="name"
                placeholder="np. Kraków Rolety — SEO Q1 2026"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="domain">
                Domena
              </label>
              <Input
                id="domain"
                name="domain"
                placeholder="np. krakowrolety.pl"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Clusters CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Klastry (CSV)
              <Badge variant="destructive" className="ml-2 text-[10px]">
                Wymagane
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Plik <code>*_named.csv</code> z kolumnami: keyword, cluster_id,
              cluster_name, priority, core_outer, coverage_status,
              potential_score, etc.
            </p>
            <label
              htmlFor="csv-upload"
              className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
            >
              {csvFile ? (
                <>
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{csvFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Kliknij aby wybrać plik CSV
                  </span>
                </>
              )}
            </label>
            <input
              id="csv-upload"
              name="clusters_csv"
              type="file"
              accept=".csv"
              className="hidden"
              required
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
          </CardContent>
        </Card>

        {/* Briefs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Content Briefe (MD)
              <Badge variant="secondary" className="ml-2 text-[10px]">
                Opcjonalne
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Pliki <code>brief.md</code> z folderu <code>data/briefs/</code>.
              Możesz wybrać wiele plików.
            </p>
            <label
              htmlFor="briefs-upload"
              className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
            >
              {briefFiles.length > 0 ? (
                <>
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">
                    {briefFiles.length} brief(ów) wybranych
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Kliknij aby wybrać pliki .md
                  </span>
                </>
              )}
            </label>
            <input
              id="briefs-upload"
              type="file"
              accept=".md"
              multiple
              className="hidden"
              onChange={(e) =>
                setBriefFiles(Array.from(e.target.files || []))
              }
            />
          </CardContent>
        </Card>

        {/* Result feedback */}
        {result?.error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{result.error}</p>
          </div>
        )}
        {result?.success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">
              Import zakończony! Przekierowuję do dashboardu...
            </p>
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Importuję..." : "Importuj i wygeneruj plan"}
        </Button>
      </form>
    </div>
  );
}
