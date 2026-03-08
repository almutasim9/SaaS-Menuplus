-- 1. Delete duplicate delivery areas (keep only the first one per zone)
DELETE FROM delivery_areas a
USING delivery_areas b
WHERE a.zone_id = b.zone_id
  AND a.area_name = b.area_name
  AND a.created_at > b.created_at;

-- 2. Add a unique constraint to prevent future duplicates
ALTER TABLE delivery_areas
ADD CONSTRAINT unique_zone_area UNIQUE (zone_id, area_name);
