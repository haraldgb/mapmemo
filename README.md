# MapMemo

MapMemo is an attempt at a game for memorizing places of interest within cities. The idea came from realizing I never really learn the layout of where I live when I use Google Maps all the time.

## Project layout

- `frontend/`: Vite + React app (see `frontend/README.md` for setup and env vars).
- `backend/`: ASP.NET Core Web API with EFC + PostgreSQL (see `backend/README.md`). Requires Docker for integration tests.

## Terminology

A concise terminology is needed to navigate different types of areas of interest. These are displayed to the user, but maybe more so for a consequent use throughout the code base. The current WIP is based off of "bydel" and "delbydel" in Norwegian, which translates to "part of city" and "part of part of city" ("neighborhood" and "sub-neighborhood" translates well in meaning). The hope for the future is to have everything be so generic that the game can work with all types of areas - you should be able to play with "delbydel"s within "bydel"s, with countries within continents, municipalities within counties, etc. These should be coupled closely with Open Street Maps' [admin_level](https://wiki.openstreetmap.org/wiki/Key:admin_level). What the different levels entails differ between countries, however the following generalizations will be used for now:

- level 0: global
- level 1: continent
- level 2: country
- level 3: ??
- level 4: ??
- level 5: ??
- level 6: county
- level 7: municipality
- level 8: city
- level 9: neighborhood
- level 10: sub-neighborhood

Terms that describe these will be _admin level_ and _area type_. Umbrella term: _area_: agnostic to what it is. Umbrella term _locality_: specific to being the level/type it is, often coupled with type. Most area types will as such have a direct sub area type, and it will be potentially be more sensible to couple it with a sub area type of lower level as the "direct" one (country->county in the case of Norway), or to allow coupling with even lower levels (municipalities within a country, sub-neighborhoods within a city).
