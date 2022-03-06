let layers = {
  "version": 8,
  "metadata": {"maputnik:renderer": "mbgljs"},
  "center": [20, 52],
  "zoom": 6,
  "sources": {
    "raster-tiles": {
      "type": "raster",
      "tiles": [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      "tileSize": 256,
      "maxzoom": 19,
      "paint": {"raster-fade-duration": 100},
      "attribution": "data © <a target=\"_top\" rel=\"noopener\" href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors."
    },
    "aed-locations": {
      "type": "geojson",
      "data": "../../aed_poland.geojson",
      "cluster": true,
      "clusterRadius": 32,
      "maxzoom": 12
    }
  },
  "glyphs": "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  "sprite": "https://aed.openstreetmap.org.pl/dev/src/sprites/aed-style",
  "layers": [
    {
      "id": "background",
      "type": "raster",
      "source": "raster-tiles",
      "minZoom": 0,
      "maxZoom": 19
    },
    {
      "id": "unclustered",
      "type": "symbol",
      "source": "aed-locations",
      "filter": ["!", ["has", "point_count"]],
      "layout": {"icon-image": "aed-default", "icon-size": 0.75}
    },
    {
      "id": "clustered-circle",
      "type": "circle",
      "source": "aed-locations",
      "filter": ["has", "point_count"],
      "paint": {
        "circle-color": "rgba(0,145,64, 0.85)",
        "circle-radius": 20,
        "circle-stroke-color": "rgba(245, 245, 245, 0.88)",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "clustered-label",
      "type": "symbol",
      "source": "aed-locations",
      "filter": ["has", "point_count"],
      "layout": {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans Bold"],
        "text-size": 14,
        "text-letter-spacing": 0.05
      },
      "paint": {"text-color": "#f5f5f5"}
    }
  ],
  "container": "map",
  "maxZoom": 19,
  "hash": "map",
  "maxPitch": 0,
  "dragRotate": false,
  "preserveDrawingBuffer": true,
  "id": "53fam6b4c"
};