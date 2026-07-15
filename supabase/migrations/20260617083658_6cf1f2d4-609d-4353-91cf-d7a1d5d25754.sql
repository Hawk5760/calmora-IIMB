-- Remove the broad SELECT policy that lets clients list every file in the public 'avatars' bucket.
-- Public bucket files remain accessible via their direct public URLs, but enumeration via the
-- storage API is now blocked.
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;