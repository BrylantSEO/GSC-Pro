"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIntervention } from "@/app/dashboard/actions";
import { CheckCircle } from "lucide-react";

const TYPES = [
  { value: "NEW_PAGE", label: "Nowa strona" },
  { value: "CONTENT_UPDATE", label: "Aktualizacja treści" },
  { value: "META_OPTIMIZATION", label: "Meta optymalizacja" },
  { value: "INTERNAL_LINKING", label: "Internal linking" },
  { value: "TECHNICAL_FIX", label: "Fix techniczny" },
  { value: "SCHEMA_MARKUP", label: "Schema markup" },
];

export function InterventionForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [interventionType, setInterventionType] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("project_id", projectId);
    formData.set("intervention_type", interventionType);

    startTransition(async () => {
      const res = await createIntervention(formData);
      if (res.success) {
        setSaved(true);
        (e.target as HTMLFormElement).reset();
        setInterventionType("");
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nowa interwencja</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Data</label>
            <Input
              name="intervention_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Typ</label>
            <Select value={interventionType} onValueChange={(v) => v && setInterventionType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz typ..." />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              URL-e (jeden per linia)
            </label>
            <Textarea
              name="urls"
              placeholder={"/rolety-krakow/\n/plisy-krakow/"}
              rows={3}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Opis zmian</label>
            <Textarea
              name="description"
              placeholder="np. Rozbudowa treści z 800 do 2000 słów, dodanie FAQ, schema markup..."
              rows={3}
              required
            />
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Zapisano!</span>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Zapisuję..." : "Zapisz interwencję"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
