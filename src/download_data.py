import logging
from typing import List, Dict, Union, Set, Tuple
import csv
import requests
import json
import sys


logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__file__)
logger.setLevel(logging.INFO)

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
    'wikimedia_commons',
}

prefix_to_add = {
    'wikimedia_commons': 'https://commons.wikimedia.org/wiki/',
}


def geojson_point_feature(lat: float, lon: float, properties: Dict[str, str]) -> dict:
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        },
        "properties": properties,
    }


def elements_from_overpass_api(api_url: str, query: str) -> List[dict]:
    logger.info(f'Requesting data from: {api_url}')
    try:
        response = requests.post(url=api_url, data={'data': query})
        response.raise_for_status()
        return response.json()['elements']
    except requests.RequestException:
        logger.error('Problem while querying Overpass API.', exc_info=True)
        return []


def process_data(
    data: List[dict],
    keep_tags: Union[bool, Set[str]],
    prefixes: Dict[str, str],
) -> Tuple[dict, Set[str], List[dict]]:
    """Process data from Overpass API and return tuple with data ready to be dumped to:
    GeoJSON (1st elem), CSV columns (2nd elem), CSV data (3rd elem).
    """

    geojson_template = {
        "type": "FeatureCollection",
        "features": [],
    }
    csv_row_list: List[Dict[str, str]] = []
    csv_columns_set: Set[str] = set()

    logger.info('Processing data...')
    for element in data:
        # prepare
        osm_id = element['id']
        longitude = element['lon']
        latitude = element['lat']
        if type(keep_tags) == bool and keep_tags is True:
            tags = {key: prefixes.get(key, '') + value for key, value in element['tags'].items()}
        elif type(keep_tags) == bool and keep_tags is False:
            tags = {}
        else:
            tags = {
                key: prefixes.get(key, '') + value for key, value in element['tags'].items() if key in tags_to_keep
            }
        geojson_properties = {'osm_id': osm_id, **tags}
        csv_attributes = {
            'osm_id': str(osm_id),
            'latitude': str(latitude),
            'longitude': str(longitude),
            **tags
        }
        csv_columns_set.update(csv_attributes.keys())

        # append
        geojson_template['features'].append(
            geojson_point_feature(lat=latitude, lon=longitude, properties=geojson_properties)
        )
        csv_row_list.append(csv_attributes)
    logger.info(f'Prepared data to save. Number of rows: {len(csv_row_list)}')

    return geojson_template, csv_columns_set, csv_row_list


def save_geojson(file_path: str, data: dict) -> None:
    logger.info(f'Saving file: {file_path}...')
    with open(file=file_path, mode='w', encoding='utf-8') as f:
        json.dump(data, f, allow_nan=False)
    logger.info('Done.')


def save_csv(file_path: str, data: List[dict], columns: List[str]) -> None:
    logger.info(f'Saving file: {file_path}...')
    with open(file=file_path, mode='w', encoding='utf-8') as f:
        csv_writer = csv.DictWriter(f, fieldnames=columns)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    logger.info('Done.')


if __name__ == '__main__':

    geojson_file_path = sys.argv[1] if len(sys.argv) > 1 else 'aed_poland.geojson'
    csv_file_path = sys.argv[2] if len(sys.argv) > 2 else 'aed_poland.csv'

    elements = elements_from_overpass_api(api_url=overpass_api_url, query=overpass_query)
    geojson_data, csv_columns, csv_data = process_data(data=elements, keep_tags=tags_to_keep, prefixes=prefix_to_add)

    save_geojson(file_path=geojson_file_path, data=geojson_data)
    sorted_csv_columns = list(sorted(list(csv_columns)))
    save_csv(file_path=csv_file_path, data=csv_data, columns=sorted_csv_columns)
