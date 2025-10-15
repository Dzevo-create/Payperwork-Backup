-- Add source_image field to sketch_to_render table
-- This stores the URL of the source image (original or previous render) used to create renders/videos/upscales

ALTER TABLE sketch_to_render
ADD COLUMN IF NOT EXISTS source_image TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sketch_to_render_source_image
ON sketch_to_render(source_image);

-- Comment for documentation
COMMENT ON COLUMN sketch_to_render.source_image IS 'URL of the source image used to create this generation (original upload for renders, previous render for videos/upscales)';
