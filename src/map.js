const aedSource = './aed_poland.geojson';
const customLayerSource= './custom_layer.geojson';
const aedMetadata = './aed_poland_metadata.json';
const controlsLocation = 'bottom-right';
let aedNumberElements = [
    document.getElementById('aed-number'),
    document.getElementById('aed-number-mobile'),
];
let aedNumberComment = document.getElementById('aed-number-comment');

let fetchMetadata = fetch(aedMetadata);

var map = new maplibregl.Map({
    'container': 'map', // container id
    'center': [20, 52], // starting position [lng, lat]
    'maxZoom': 19, // max zoom to allow
    'zoom': 6, // starting zoom
    'hash': 'map',
    'maxPitch': 0,
    'dragRotate': false,
    'preserveDrawingBuffer': true,
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
                'maxzoom': 19,
                //'attribution': `<span id="refresh-time"></span>dane © <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.`,
            },
            'aed-locations': {
                'type': 'geojson',
                'data': aedSource,
                'cluster': true,
                'clusterRadius': 32,
                'maxzoom': 12,
            },
            'custom-source': {
                'type': 'geojson',
                'data': customLayerSource,
                'cluster': false,
                'maxzoom': 12,
            },
        },
        'layers': [{
            'id': 'background',
            'type': 'raster',
            'source': 'raster-tiles',
            'minZoom': 0,
            'maxZoom': 19,
        }, {
            'id': 'clustered-circle',
            'type': 'circle',
            'source': 'aed-locations',
            'paint': {
                'circle-color': 'rgba(0,145,64, 0.85)',
                'circle-radius': 26,
                'circle-stroke-color': 'rgba(245, 245, 245, 0.88)',
                'circle-stroke-width': 3,
            },
            'filter': ['has', 'point_count'],
        }, {
            'id': 'clustered-label',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold'],
                'text-size': 20,
                'text-letter-spacing': 0.05,
                'text-allow-overlap': true,
                },
            'paint': {
                    'text-color': '#f5f5f5',
                },
                'filter': ['has', 'point_count'],
        }, ],
    },
});
console.log('MapLibre library version: ' + map.version);

map.scrollZoom.setWheelZoomRate(1 / 100);

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

let control = new maplibregl.NavigationControl();
map.addControl(control, controlsLocation);
let geolocate = new maplibregl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    }
});
map.addControl(geolocate, controlsLocation);

console.log('Loading icon...');
map.loadImage('./src/img/marker-image_50.png', (error, image) => {
    if (error) throw error;
    map.addImage('aed-icon', image, {
        'sdf': false
    });
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

map.on('load', () => {
    // get metadata and fill page with info about number of defibrillators and last refresh time
    fetchMetadata
        .then(response => response.json())
        .then(data => {
            // number of defibrillators
            aedNumberElements.forEach(el => el.innerHTML = data.number_of_elements);
            aedNumberComment.classList.remove("is-hidden");
            // last refresh time
            let refreshTimeValue = new Date(data.data_download_ts_utc);
            let refreshTimeValueLocale = new Date(data.data_download_ts_utc).toLocaleString('pl-PL');
            let currentDate = new Date();
            let dateDiff = Math.abs(currentDate - refreshTimeValue);
            let dateDiffMinutes = Math.round(dateDiff / 60000);
            let refreshTime = document.getElementById('refresh-time');
            refreshTime.innerHTML = `Ostatnia aktualizacja danych OSM: <span class="has-text-grey-dark" title="${refreshTimeValueLocale}">${dateDiffMinutes} minut temu </span>`;
        });

    console.log('Adding layers...');
    map.addLayer({
        'id': 'unclustered',
        'type': 'symbol',
        'source': 'aed-locations',
        'layout': {
            'icon-image': ['image', 'aed-icon'],
            'icon-size': 1,
            'icon-allow-overlap': true,
        },
        'filter': ['!', ['has', 'point_count']],
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

    console.log('Map ready.');
});

function toggleCustomLayer() {
    const customLayerId = "mobile-aed";
    let layer = map.getLayer(customLayerId);
    if (layer) {
        console.log("Removing " + customLayerId + " layer from map.");
        map.removeLayer(customLayerId);
    } else {
        console.log("Adding " + customLayerId + " layer to map.");
        map.addLayer({
            'id': customLayerId,
            'type': 'circle',
            'source': 'custom-source',
            'paint': {
                'circle-color': 'rgba(237, 223, 1, 0.85)',
                'circle-radius': 26,
                'circle-stroke-color': 'rgba(245, 245, 245, 0.88)',
                'circle-stroke-width': 3,
            },
            'filter': ['==', 'type', 'mobile'],
        });
    }
}
