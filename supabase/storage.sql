-- Create Storage Buckets for Images and Videos

-- Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Videos Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (allow all for now)
CREATE POLICY "Allow public read access on images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Allow public insert on images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public delete on images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

CREATE POLICY "Allow public read access on videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Allow public insert on videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public delete on videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');
