
CREATE TABLE public.shared_subtitles (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  label text not null,
  content text not null,
  source_url text,
  language text default 'unknown',
  created_at timestamptz not null default now()
);

CREATE INDEX shared_subtitles_video_id_idx ON public.shared_subtitles (video_id, created_at desc);

GRANT SELECT, INSERT ON public.shared_subtitles TO anon;
GRANT SELECT, INSERT ON public.shared_subtitles TO authenticated;
GRANT ALL ON public.shared_subtitles TO service_role;

ALTER TABLE public.shared_subtitles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared subtitles"
  ON public.shared_subtitles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add shared subtitles"
  ON public.shared_subtitles FOR INSERT
  WITH CHECK (
    length(content) > 0
    AND length(content) < 2000000
    AND length(video_id) > 0
    AND length(video_id) < 64
    AND length(label) < 512
  );
