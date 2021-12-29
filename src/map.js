const aedSource = './aed_poland.geojson';
const aedMetadata = './aed_poland_metadata.json';
let aedNumber = document.getElementById('aed-number');

var map = new maplibregl.Map({
    'container': 'map', // container id
    'center': [20, 52], // starting position [lng, lat]
    'maxZoom': 19, // max zoom to allow
    'zoom': 6, // starting zoom
    'hash': 'map',
    'maxPitch': 0,
    'dragRotate': false,
    'style': {
        'version': 8,
        "glyphs": "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                'tileSize': 256,
                'attribution': `<span id="refresh-time"></span>dane © <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.`,
            },
            'aed-locations': {
                'type': 'geojson',
                'data': aedSource,
                'cluster': true,
                'clusterRadius': 32,
                'maxzoom': 14
            },
        },
        'layers': [{
            'id': 'background',
            'type': 'raster',
            'source': 'raster-tiles',
            'minZoom': 0,
        }, ]
    },
});
console.log('MapLibre library version: ' + map.version);

map.scrollZoom.setWheelZoomRate(1 / 100);

let control = new maplibregl.NavigationControl();
map.addControl(control, 'bottom-right');
let geolocate = new maplibregl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    }
});
map.addControl(geolocate, 'bottom-right');

map.on('load', () => {

    // get metadata and fill page with info about number of defibrillators and last refresh time
    fetch(aedMetadata)
      .then(response => response.json())
      .then(data => {
        // number of defibrillators
        aedNumber.innerHTML = data.number_of_elements;
        // last refresh time
        let refreshTimeValue = new Date(data.data_download_ts_utc);
        let refreshTimeValueLocale = new Date(data.data_download_ts_utc).toLocaleString('pl-PL');
        let currentDate = new Date();
        let dateDiff = Math.abs(currentDate - refreshTimeValue);
        let dateDiffMinutes = Math.round(dateDiff / 60000);
        let refreshTime = document.getElementById('refresh-time');
        refreshTime.innerHTML = `Ostatnia aktualizacja danych OSM: <span class="has-text-grey-dark" title="${refreshTimeValueLocale}">${dateDiffMinutes} minut temu </span>`;
      });

    console.log('Loading icon...');

    map.loadImage('./src/img/marker-image_50.png', (error, image) => {
        if (error) throw error;
        map.addImage('aed-icon', image, {
            'sdf': false
        });
        console.log('Adding layers...');
        map.addLayer({
            'id': 'unclustered',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'icon-image': ['image', 'aed-icon'],
                'icon-size': 1,
            },
            'filter': ['!', ['has', 'point_count']],
        });
        map.addLayer({
            'id': 'clustered-circle',
            'type': 'circle',
            'source': 'aed-locations',
            'paint': {
                'circle-color': 'rgba(0, 137, 84, 0.88)',
                'circle-radius': 26,
                'circle-stroke-color': 'rgba(245, 245, 245, 0.88)',
                'circle-stroke-width': 3,
            },
            'filter': ['has', 'point_count'],
        });
        map.addLayer({
            'id': 'clustered-label',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold'],
                'text-size': 20,
                'text-letter-spacing': 0.05,
            },
            'paint': {
                'text-color': '#f5f5f5',
            },
            'filter': ['has', 'point_count'],
        });

        map.on('click', 'unclustered', function (e) {
            if (e.features[0].properties !== undefined) {
                let properties = {
                    action: "showDetails",
                    data: e.features[0].properties,
                };
                showSidebar(properties);
            }
        });

        map.on('mouseenter', 'unclustered', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'unclustered', () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseenter', 'clustered-circle', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'clustered-circle', () => {
            map.getCanvas().style.cursor = '';
        });

        // zoom to cluster on click
        map.on('click', 'clustered-circle', function (e) {
            var features = map.queryRenderedFeatures(e.point, {
                layers: ['clustered-circle']
            });
            var clusterId = features[0].properties.cluster_id;
            map.getSource('aed-locations').getClusterExpansionZoom(
                clusterId,
                function (err, zoom) {
                    if (err) return;
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });

        console.log('Map ready.');
    });
});
