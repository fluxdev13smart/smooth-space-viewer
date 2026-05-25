import { createFileRoute } from "@tanstack/react-router";

const UA = "SmoothWatchSpace v1.0.0";

export const Route = createFileRoute("/api/subtitles/download")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.OPENSUBTITLES_API_KEY;
          if (!apiKey) {
            return Response.json({ error: "OPENSUBTITLES_API_KEY not configured" }, { status: 500 });
          }
          const body = (await request.json().catch(() => null)) as { file_id?: number } | null;
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
          const dlText = await dl.text();
          let dlJson: any = null;
          try {
            dlJson = JSON.parse(dlText);
          } catch {
            // ignore
          }
          if (!dl.ok || !dlJson?.link) {
            console.error("OpenSubtitles download request failed", dl.status, dlText);
            return Response.json(
              {
                error: dlJson?.message || `Download request failed (${dl.status})`,
                details: dlJson ?? dlText.slice(0, 500),
              },
              { status: dl.status || 500 },
            );
          }

          const srt = await fetch(dlJson.link);
          if (!srt.ok) {
            console.error("Subtitle file fetch failed", srt.status, dlJson.link);
            return Response.json(
              { error: `Failed to fetch subtitle file (${srt.status})` },
              { status: 502 },
            );
          }
          // Decode robustly — some files are latin1/windows-1252
          const buf = await srt.arrayBuffer();
          let text: string;
          try {
            text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
          } catch {
            text = new TextDecoder("windows-1252").decode(buf);
          }
          return new Response(text, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        } catch (err: any) {
          console.error("subtitles/download error", err);
          return Response.json(
            { error: err?.message || "Internal error" },
            { status: 500 },
          );
        }
      },
    },
  },
});