"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseClusterCSV } from "@/lib/parsers/cluster-csv";
import { generateSchedule } from "@/lib/scheduler/algorithm";
import type { Cluster } from "@/lib/supabase/types";

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient();

  const update: Record<string, unknown> = { status };
  if (status === "DONE") {
    update.completed_at = new Date().toISOString();
  } else {
    update.completed_at = null;
  }

  await supabase.from("seo_tasks").update(update).eq("id", taskId);
  revalidatePath("/dashboard");
}

export async function importProject(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const domain = formData.get("domain") as string;
  const csvFile = formData.get("clusters_csv") as File;

  if (!name || !domain || !csvFile) {
    return { error: "Brakuje wymaganych pól" };
  }

  // 1. Create project
  const { data: project, error: projectError } = await supabase
    .from("seo_projects")
    .insert({ name, domain })
    .select()
    .single();

  if (projectError) {
    return { error: `Projekt: ${projectError.message}` };
  }

  // 2. Parse CSV
  const csvText = await csvFile.text();
  const parsedClusters = parseClusterCSV(csvText);

  if (parsedClusters.length === 0) {
    return { error: "CSV nie zawiera żadnych klastrów" };
  }

  // 3. Insert clusters
  const clusterInserts = parsedClusters.map((c) => ({
    project_id: project.id,
    cluster_id: c.cluster_id,
    name: c.name,
    canonical_query: c.canonical_query,
    central_entity: c.central_entity,
    cluster_type: c.cluster_type,
    core_outer: c.core_outer,
    priority: c.priority,
    coverage_status: c.coverage_status,
    existing_url: c.existing_url,
    target_url: c.target_url,
    total_volume: c.total_volume,
    avg_kd: c.avg_kd,
    avg_cpc: c.avg_cpc,
    potential_score: c.potential_score,
    keywords_count: c.keywords.length,
  }));

  const { data: insertedClusters, error: clustersError } = await supabase
    .from("seo_clusters")
    .insert(clusterInserts)
    .select();

  if (clustersError) {
    return { error: `Klastry: ${clustersError.message}` };
  }

  // 4. Insert keywords
  const clusterIdMap = new Map<number, string>();
  for (const ic of insertedClusters) {
    clusterIdMap.set(ic.cluster_id, ic.id);
  }

  const keywordInserts = parsedClusters.flatMap((c) =>
    c.keywords.map((kw) => ({
      cluster_id: clusterIdMap.get(c.cluster_id)!,
      keyword: kw.keyword,
      typ: kw.typ,
      volume: kw.volume,
      kd: kw.kd,
      cpc: kw.cpc,
    }))
  );

  if (keywordInserts.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < keywordInserts.length; i += 500) {
      const batch = keywordInserts.slice(i, i + 500);
      await supabase.from("seo_keywords").insert(batch);
    }
  }

  // 5. Import briefs if provided
  const briefFiles = formData.getAll("briefs") as File[];
  for (const briefFile of briefFiles) {
    if (!briefFile.name.endsWith(".md")) continue;
    const content = await briefFile.text();
    const slug = briefFile.name.replace(/\.md$/, "").replace(/\s+/g, "_");
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1] : slug;

    await supabase.from("seo_briefs").insert({
      project_id: project.id,
      slug,
      title,
      content_md: content,
    });
  }

  // 6. Auto-schedule tasks
  const schedule = generateSchedule(insertedClusters as Cluster[], {
    totalWeeks: 12,
    maxSlotsPerWeek: 3,
    projectId: project.id,
  });

  if (schedule.length > 0) {
    await supabase.from("seo_tasks").insert(schedule);
  }

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

export async function createIntervention(formData: FormData) {
  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const interventionDate = formData.get("intervention_date") as string;
  const interventionType = formData.get("intervention_type") as string;
  const urlsRaw = formData.get("urls") as string;
  const description = formData.get("description") as string;
  const taskId = (formData.get("task_id") as string) || null;

  const urls = urlsRaw
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (!projectId || !interventionDate || !interventionType || urls.length === 0 || !description) {
    return { error: "Wypełnij wszystkie wymagane pola" };
  }

  const { error } = await supabase.from("seo_interventions").insert({
    project_id: projectId,
    task_id: taskId,
    intervention_date: interventionDate,
    intervention_type: interventionType,
    urls,
    description,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/interventions");
  revalidatePath("/dashboard/tracker");
  return { success: true };
}
