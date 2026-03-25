-- Public storage bucket for event photos uploaded from the admin panel.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (images appear on the public member calendar)
CREATE POLICY "event_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

-- Authenticated members can upload
CREATE POLICY "event_images_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
  );

-- Authenticated members can delete (so admins can replace images)
CREATE POLICY "event_images_auth_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
  );
