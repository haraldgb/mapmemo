-- Returns the latest applied EFC migration ID.
-- Used by the import script to verify schema compatibility before import.
SELECT migration_id
FROM "__EFMigrationsHistory"
ORDER BY migration_id DESC
LIMIT 1;
