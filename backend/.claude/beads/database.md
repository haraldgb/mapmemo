# Database

PostgreSQL. Schema in `db/schema.sql`. Data populated via private submodule (`db/data/`).

## Schema

```
city          — id, name, added, updated (auto-trigger)
road          — id, name, city_id (FK city, unique per city)
osm_way       — id (OSM ID), road_id (FK road), name
intersection  — id, lat, lng, road_a_id, road_b_id (FK road), way_type
intersection_source — id, intersection_id, osm_way_id, node_id
```

## Key relationships

- `road` belongs to `city` (cascading delete)
- `intersection` links two `road` records (`road_a_id`, `road_b_id`)
- `osm_way` links OSM data to internal road records
- `intersection_source` traces intersections back to OSM ways/nodes

## Indexes

- `road(city_id)`, unique `road(city_id, name)`
- `intersection(road_a_id)`, `intersection(road_b_id)`
- `osm_way(road_id)`, `intersection_source(intersection_id, osm_way_id)`

## Query patterns

- Raw SQL via Npgsql (no EF Core, no Dapper)
- Always use parameterized queries (`cmd.Parameters.AddWithValue`)
- Coordinates: `NUMERIC(9,6)` — cast to `decimal` in C#, convert to `double` for JSON response
- `updated_at` columns use a plpgsql trigger — don't set manually on UPDATE
