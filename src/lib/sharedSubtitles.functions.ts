import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getSharedSubtitles = createServerFn({ method: "GET" })
  .inputValidator((input: { videoId: string }) =>
    z.object({ videoId: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("shared_subtitles")
      .select("id,label,content,language,source_url,created_at")
      .eq("video_id", data.videoId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const saveSharedSubtitle = createServerFn({ method: "POST" })
  .inputValidator((input: {
    videoId: string;
    label: string;
    content: string;
    sourceUrl?: string;
    language?: string;
  }) =>
    z
      .object({
        videoId: z.string().min(1).max(64),
        label: z.string().min(1).max(500),
        content: z.string().min(1).max(1_900_000),
        sourceUrl: z.string().url().max(2000).optional(),
        language: z.string().max(16).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("shared_subtitles").insert({
      video_id: data.videoId,
      label: data.label,
      content: data.content,
      source_url: data.sourceUrl ?? null,
      language: data.language ?? "unknown",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });