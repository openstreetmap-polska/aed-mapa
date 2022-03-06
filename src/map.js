const aedMetadata = './aed_poland_metadata.json';
const controlsLocation = 'bottom-right';
let aedNumberElements = [
    document.getElementById('aed-number'),
    document.getElementById('aed-number-mobile'),
];
let aedNumberComment = document.getElementById('aed-number-comment');

let fetchMetadata = fetch(aedMetadata);

const map = new maplibregl.Map({
        "container": "map",
        "style": layers 
    });

    map.loadImage('./src/img/marker-image-yes.png', (error, image) => {
        if (error) throw error;
    
        map.addImage('aed-icon-yes', image, {
            'sdf': false
        });
    });

//map.scrollZoom.setWheelZoomRate(1 / 100);
map.scrollZoom.setWheelZoomRate(1);

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

let control = new maplibregl.NavigationControl({showCompass: false});
map.addControl(control, controlsLocation);
let geolocate = new maplibregl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    }
});
map.addControl(geolocate, controlsLocation);

var geocoder_api = {
    forwardGeocode: async (config) => {
        const features = [];
        try {
            let request =
                'https://nominatim.openstreetmap.org/search?q=' +
                config.query +
                '&countrycodes=pl&format=geojson&polygon_geojson=1&addressdetails=1';
            const response = await fetch(request);
            const geojson = await response.json();
            for (let feature of geojson.features) {
                let center = [
                    feature.bbox[0] +
                    (feature.bbox[2] - feature.bbox[0]) / 2,
                    feature.bbox[1] +
                    (feature.bbox[3] - feature.bbox[1]) / 2
                ];
                let point = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: center
                    },
                    place_name: feature.properties.display_name,
                    properties: feature.properties,
                    text: feature.properties.display_name,
                    place_type: ['place'],
                    center: center
                };
                features.push(point);
            }
        } catch (e) {
            console.error(`Failed to forwardGeocode with error: ${e}`);
        }

        return {
            features: features
        };
    }
};
map.addControl(
    new MaplibreGeocoder(geocoder_api, {
        maplibregl: maplibregl
    }),
    'top-right'
);

console.log('Loading icon...');

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

map.on('load', (e) => {
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
                'circle-radius': 22,
                'circle-stroke-color': 'rgba(245, 245, 245, 0.88)',
                'circle-stroke-width': 3,
            },
            'filter': ['==', 'type', 'mobile'],
        });
    }
}