CREATE TABLE city (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  added TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  min_lat DOUBLE PRECISION,
  min_lon DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lon DOUBLE PRECISION
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER city_set_updated_at
BEFORE UPDATE ON city
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE road (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  city_id BIGINT NOT NULL REFERENCES city(id) ON DELETE CASCADE
);

CREATE TABLE osm_way (
  id BIGINT PRIMARY KEY,
  road_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
  name VARCHAR(200)
);

CREATE TABLE roundabout (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL REFERENCES city(id) ON DELETE CASCADE
);

CREATE TABLE junction (
  id BIGSERIAL PRIMARY KEY,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  way_type VARCHAR(50),
  roundabout_id BIGINT REFERENCES roundabout(id) ON DELETE SET NULL
);

CREATE TABLE road_junction (
  id BIGSERIAL PRIMARY KEY,
  junction_id BIGINT NOT NULL REFERENCES junction(id) ON DELETE CASCADE,
  road_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
  node_index INTEGER NOT NULL
);

CREATE INDEX idx_road_city_id ON road(city_id);
CREATE UNIQUE INDEX ux_road_city_name ON road(city_id, name);
CREATE INDEX idx_osm_way_road_id ON osm_way(road_id);
CREATE INDEX idx_roundabout_city_id ON roundabout(city_id);
CREATE INDEX idx_junction_roundabout_id ON junction(roundabout_id);
CREATE INDEX idx_road_junction_junction_id ON road_junction(junction_id);
CREATE INDEX idx_road_junction_road_id ON road_junction(road_id);
