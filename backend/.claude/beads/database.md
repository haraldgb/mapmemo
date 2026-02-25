# Database

PostgreSQL. Schema in `db/schema.sql`. Data populated via private submodule (`db/data/`).

## Schema

```
city          — id, name, added, updated (auto-trigger)
road          — id, name, city_id (FK city, unique per city)
osm_way       — id (OSM ID), road_id (FK road), name
roundabout    — id, city_id (FK city)
junction      — id, lat, lng, way_type, roundabout_id (FK roundabout, nullable)
road_junction — id, junction_id (FK junction), road_id (FK road), node_index
```

## Key relationships

- `road` belongs to `city` (cascading delete)
- `junction` is a point where ≥2 roads meet; linked to roads via `road_junction`
- `road_junction.node_index` records the junction's ordered position along the road
- `roundabout` groups junctions that belong to the same physical roundabout
- `osm_way` links OSM data to internal road records

## Indexes

- `road(city_id)`, unique `road(city_id, name)`
- `junction(roundabout_id)`
- `road_junction(junction_id)`, `road_junction(road_id)`
- `osm_way(road_id)`, `roundabout(city_id)`

## Query patterns

- Raw SQL via Npgsql (no EF Core, no Dapper)
- Always use parameterized queries (`cmd.Parameters.AddWithValue`)
- Coordinates: `NUMERIC(9,6)` — cast to `decimal` in C#, convert to `double` for JSON response
- `updated_at` columns use a plpgsql trigger — don't set manually on UPDATE
