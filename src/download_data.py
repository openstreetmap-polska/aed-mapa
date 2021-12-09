import requests
import json
import sys


def geojson_point_feature(lat: float, lon: float, properties: dict) -> dict:
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        },
        "properties": properties,
    }


overpass_api_url = 'https://lz4.overpass-api.de/api/interpreter'

overpass_query = '''
[out:json][timeout:90];
// area(3600049715) = Polska
area(3600049715)->.searchArea;
// gather results
(
  // query part for: “emergency=defibrillator”
  node[emergency=defibrillator](area.searchArea);
);
// print results
out body;
>;
out skel qt;'''

tags_to_keep = {
    'emergency',
    'defibrillator:location',
    'defibrillator:location:pl',
    'access',
    'indoor',
    'description',
    'description:pl',
    'phone',
    'note',
    'note:pl',
    'opening_hours',
}

response = requests.post(url=overpass_api_url, data={'data': overpass_query})
response.raise_for_status()
elements = response.json().get('elements')

geojson = {
    "type": "FeatureCollection",
    "features": [],
}
for element in elements:
    osm_id = element['id']
    longitude = element['lon']
    latitude = element['lat']
    tags = {
        key: value for key, value in element['tags'].items() if key in tags_to_keep
    }
    tags['osm_id'] = osm_id
    geojson['features'].append(
        geojson_point_feature(lat=latitude, lon=longitude, properties=tags)
    )

file_path = sys.argv[1] if len(sys.argv) == 2 else 'src/aed_poland.geojson'

with open(file=file_path, mode='w', encoding='utf-8') as f:
    json.dump(geojson, f, allow_nan=False)
