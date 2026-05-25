import { createFileRoute } from "@tanstack/react-router";

const UA = "SmoothWatchSpace v1.0.0";

export const Route = createFileRoute("/api/subtitles/download")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENSUBTITLES_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "OPENSUBTITLES_API_KEY not configured" }, { status: 500 });
        }
        const body = await request.json().catch(() => null) as { file_id?: number } | null;
        const fileId = body?.file_id;
        if (!fileId) {
          return Response.json({ error: "Missing file_id" }, { status: 400 });
        }

        const dl = await fetch("https://api.opensubtitles.com/api/v1/download", {
          method: "POST",
          headers: {
            "Api-Key": apiKey,
            "User-Agent": UA,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ file_id: fileId }),
        });
        const dlJson = await dl.json().catch(() => null);
        if (!dl.ok || !dlJson?.link) {
          return Response.json(
            { error: dlJson?.message || `Download request failed (${dl.status})`, details: dlJson },
            { status: dl.status || 500 },
          );
        }

        const srt = await fetch(dlJson.link);
        if (!srt.ok) {
          return Response.json({ error: `Failed to fetch subtitle file (${srt.status})` }, { status: 502 });
        }
        const text = await srt.text();
        return new Response(text, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-File-Name": dlJson.file_name || "subtitle.srt",
          },
        });
      },
    },
  },
});