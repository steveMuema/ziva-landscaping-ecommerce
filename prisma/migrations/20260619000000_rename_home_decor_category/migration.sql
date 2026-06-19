-- Rename "Home Décor & Furnishing" → "Home Decor & Furnishing".
-- Removes the accented é so slugify() produces a stable, ASCII-safe URL slug
-- ("home-decor-and-furnishing") that round-trips correctly through slugToName().
-- Idempotent: no-op if the name is already "Home Decor & Furnishing".

UPDATE "Category"
SET "name" = 'Home Decor & Furnishing'
WHERE "name" = 'Home Décor & Furnishing';
