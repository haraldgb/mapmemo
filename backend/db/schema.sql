CREATE TABLE city (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  added TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
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
  city_id BIGINT NOT NULL REFERENCES city(id) ON DELETE CASCADE
);

CREATE TABLE osm_way (
  id BIGINT PRIMARY KEY,
  road_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
  name VARCHAR(200)
);

CREATE TABLE intersection (
  id BIGSERIAL PRIMARY KEY,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  road_a_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
  road_b_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
  way_type VARCHAR(50)
);

CREATE INDEX idx_road_city_id ON road(city_id);
CREATE INDEX idx_osm_way_road_id ON osm_way(road_id);
CREATE INDEX idx_intersection_road_a_id ON intersection(road_a_id);
CREATE INDEX idx_intersection_road_b_id ON intersection(road_b_id);
