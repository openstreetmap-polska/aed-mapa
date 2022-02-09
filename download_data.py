import logging
from copy import deepcopy
from typing import List, Dict, Union, Set
import csv
import requests
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pyexcel_ods3
import gspread

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__file__)
logger.setLevel(logging.INFO)

overpass_api_url = "https://lz4.overpass-api.de/api/interpreter"

overpass_query = """
                    [out:json]
                    [timeout:90];                
                    area(3600049715)->.searchArea; // Polska
                        (
                            node[emergency=defibrillator](area.searchArea);
                        );
                        out body;
                    >;
                    out skel qt;
                """

tag_name_mapping = {
    "defibrillator:location": "lokalizacja (osm_tag:defibrillator:location)",
    "defibrillator:location:pl": "lokalizacja_pl (osm_tag:defibrillator:location:pl)",
    "access": "dostęp (osm_tag:access)",
    "indoor": "czy wewnątrz budynku (osm_tag:indoor)",
    "location": "czy wewnątrz budynku (osm_tag:location)",
    "description": "opis (osm_tag:description)",
    "description:pl": "opis_pl (osm_tag:description:pl)",
    "phone": "telefon (osm_tag:phone)",
    "note": "notatka (osm_tag:note)",
    "note:pl": "notatka_pl (osm_tag:note:pl)",
    "opening_hours": "godziny dostępności (osm_tag:opening_hours)",
    "wikimedia_commons": "zdjęcie (osm_tag:wikimedia_commons)",
    "osm_id": "id osm",
    "osm_node_url": "url obiektu osm",
}

tags_to_keep = {
    tag for tag in tag_name_mapping if tag not in ("osm_id", "osm_node_url")
}

prefix_to_add = {
    "wikimedia_commons": "https://commons.wikimedia.org/wiki/",
    "osm_node_url": "https://osm.org/node/",
}

geojson_template = {
    "type": "FeatureCollection",
    "features": [],
}


def geojson_point_feature(lat: float, lon: float, properties: Dict[str, str]) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": properties,
    }


def get_elements_from_overpass_api(api_url: str, query: str) -> List[dict]:
    logger.info(f"Requesting data from Overpass API. [url={api_url}]")
    try:
        response = requests.post(url=api_url, data={"data": query})
        response.raise_for_status()
        return response.json()["elements"]
    except requests.RequestException:
        logger.error("Problem while querying Overpass API.", exc_info=True)
        return []


def save_json(file_path: Union[str, Path], data: dict) -> None:
    logger.info(f"Saving .json file. [path={file_path}]")
    with open(file=file_path, mode="w", encoding="utf-8") as f:
        json.dump(data, f, allow_nan=False, separators=(",", ":"))
    logger.info("Done saving .json file.")


def save_csv(file_path: Union[str, Path], data: List[dict], columns: List[str]) -> None:
    logger.info(f"Saving .csv file. [path={file_path}]")
    with open(file=file_path, mode="w", encoding="utf-8") as f:
        csv_writer = csv.DictWriter(f, fieldnames=columns)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    logger.info("Done saving .csv file.")


def save_spreadsheet(file_path: str, data: Dict[str, list]) -> None:
    logger.info(f"Saving .ods file. [path:{file_path}]")
    pyexcel_ods3.save_data(file_path, data)
    logger.info("Done saving .ods file.")


def load_geocoding_cache(file_path: Union[str, Path]) -> Dict[str, str]:
    raise NotImplemented()


def save_geocoding_cache(file_path: Union[str, Path]) -> None:
    raise NotImplemented()


def main_overpass(
    output_dir: Path,
    keep_tags: Union[bool, Set[str]],
    prefixes: Dict[str, str],
    col_name_map: Dict[str, str],
) -> None:

    geojson_file_path = output_dir.joinpath("aed_poland.geojson")
    csv_file_path = output_dir.joinpath("aed_poland.csv")
    spreadsheet_file_path = output_dir.joinpath("aed_poland.ods")
    json_metadata_file_path = output_dir.joinpath("aed_poland_metadata.json")

    ts = datetime.now(tz=timezone.utc).replace(microsecond=0)
    # call Overpass API
    elements = get_elements_from_overpass_api(
        api_url=overpass_api_url, query=overpass_query
    )

    # vars for data
    geojson = deepcopy(geojson_template)
    csv_row_list: List[Dict[str, str]] = []
    csv_columns_set: Set[str] = set()
    data_sheet_name = "dane"
    metadata_sheet_name = "metadane"
    spreadsheet_template = {metadata_sheet_name: [], data_sheet_name: []}
    spreadsheet_row_list: List[Dict[str, str]] = []

    logger.info("Processing data...")
    for element in elements:
        # prepare
        osm_id = element["id"]
        longitude = element["lon"]
        latitude = element["lat"]
        if type(keep_tags) == bool and keep_tags is True:
            tags = {
                key: prefixes.get(key, "") + value
                for key, value in element["tags"].items()
            }
        elif type(keep_tags) == bool and keep_tags is False:
            tags = {}
        else:
            tags = {
                key: prefixes.get(key, "") + value
                for key, value in element["tags"].items()
                if key in tags_to_keep
            }

        geojson_properties = {"osm_id": osm_id, **tags}

        csv_attributes = {
            "osm_id": str(osm_id),
            "latitude": str(latitude),
            "longitude": str(longitude),
            **tags,
        }
        spreadsheet_attributes = {
            "osm_id": str(osm_id),
            "osm_node_url": prefixes.get("osm_node_url", "") + str(osm_id),
            "latitude": str(latitude),
            "longitude": str(longitude),
            **tags,
        }
        csv_columns_set.update(csv_attributes.keys())

        # append
        geojson["features"].append(
            geojson_point_feature(
                lat=latitude, lon=longitude, properties=geojson_properties
            )
        )
        csv_row_list.append(csv_attributes)
        spreadsheet_row_list.append(spreadsheet_attributes)

    number_of_rows = len(csv_row_list)
    sorted_csv_columns = list(sorted(list(csv_columns_set)))
    # prepare spreadsheet headers
    sorted_spreadsheet_columns = list(sorted(list(csv_columns_set) + ["osm_node_url"]))
    mapped_spreadsheet_columns = [
        col_name_map.get(col, col) for col in sorted_spreadsheet_columns
    ]
    spreadsheet_template[data_sheet_name].append(mapped_spreadsheet_columns)
    # add spreadsheet rows
    for row in spreadsheet_row_list:
        row_data = [row.get(col, "") for col in sorted_spreadsheet_columns]
        spreadsheet_template[data_sheet_name].append(row_data)

    # prepare metadata
    json_metadata = {
        "data_download_ts_utc": str(ts.isoformat()),
        "number_of_elements": number_of_rows,
    }
    spreadsheet_template[metadata_sheet_name] = [
        ["Czas pobrania danych z API", "Liczba elementów"],
        [str(ts.isoformat()), number_of_rows],
    ]

    if number_of_rows == 0:
        logger.error("Empty dataset, nothing to write. [number_of_rows=0]")
    else:
        logger.info(f"Data prepared to save. [number_of_rows={number_of_rows}]")
        save_json(file_path=geojson_file_path, data=geojson)
        save_csv(file_path=csv_file_path, data=csv_row_list, columns=sorted_csv_columns)
        save_spreadsheet(
            file_path=spreadsheet_file_path.as_posix(), data=spreadsheet_template
        )
        save_json(file_path=json_metadata_file_path, data=json_metadata)


def main_google_sheets(output_dir: Path, config_files_dir: Path) -> None:
    sa_credentials_json_path = (
        config_files_dir.joinpath("sa-credentials.json").resolve().as_posix()
    )
    config_path = config_files_dir.joinpath("gsheetsurl").resolve().as_posix()

    custom_layer_file_path = output_dir.joinpath("custom_layer.geojson")
    geojson = deepcopy(geojson_template)

    try:
        with open(config_path, "r").read() as gsheets_url:
            logger.info("Reading Google Sheets credentials.")
            gc = gspread.service_account(filename=sa_credentials_json_path)
            logger.info("Opening Google Sheets url.")
            gsheet = gc.open_by_url(gsheets_url)
            data = gsheet.worksheet("dane_raw").get_all_records()
            logger.info(
                f"Reading rows from Google Sheets. Rows to process: {len(data)}."
            )
            counter = 0
            for row in data:
                if (
                    all([row["latitude"], row["longitude"]])
                    and row.get("import", "UNKNOWN") == "FALSE"
                ):
                    geojson["features"].append(
                        geojson_point_feature(
                            lat=row["latitude"],
                            lon=row["longitude"],
                            properties={"type": row.get("typ")},
                        )
                    )
                    counter += 1
            logger.info(f"{counter} features to export.")
            if len(geojson["features"]) > 0:
                save_json(file_path=custom_layer_file_path.as_posix(), data=geojson)
    except FileNotFoundError:
        logger.error(f"Config file not found. [config_path={config_path}]")


if __name__ == "__main__":

    this_files_dir = Path(__file__).parent.resolve()

    arg1 = Path(sys.argv[1]) if len(sys.argv) > 1 else this_files_dir
    arg2 = Path(sys.argv[2]) if len(sys.argv) > 2 else this_files_dir
    if not arg1.is_dir():
        logger.error(f'Given path: "f{arg1}" is not a directory.')
        sys.exit()

    main_overpass(
        output_dir=arg1,
        keep_tags=tags_to_keep,
        prefixes=prefix_to_add,
        col_name_map=tag_name_mapping,
    )
    main_google_sheets(output_dir=arg1, config_files_dir=arg2)
