var map = new maplibregl.Map({
    'container': 'map', // container id
    'center': [20, 52], // starting position [lng, lat]
    'maxZoom': 19, // max zoom to allow
    'zoom': 6, // starting zoom
    'hash': 'map',
    'style': {
        'version': 8,
        "glyphs": "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                'tileSize': 256,
                'attribution': 'map © <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
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

let control = new maplibregl.NavigationControl();
map.addControl(control, 'bottom-right');

function defineColor(access) {
    accessValues = {
        'yes': 'has-background-green',
        'no': 'has-background-grey',
        'private': 'has-background-grey',
        'permissive': 'has-background-link-dark',
        'default': 'has-background-grey'
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function defineAccessDescription(access) {
    accessValues = {
        'yes': 'ogólnodostępny',
        'no': 'prywatny',
        'private': 'prywatny',
        'permissive': 'o ograniczonym dostępie',
        'default': ''
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function defineOpeningHours(openingHours) {
    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return 'całodobowo';
        } else {
            return openingHours;
        }
    } else {
        return undefined;
    }
}

function defineIndoor(indoor) {
    if (indoor == 'yes') {
        return 'tak';
    } else if (indoor == 'no') {
        return 'nie';
    } else {
        return undefined;
    }
}

function showSidebar(properties) {
    // SIDEBAR - UI
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        createSidebar(properties);
    } else {
        console.log('sidebar not found');
    }

}

function hideSidebar() {
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.add('is-invisible');
    } else {
        console.log('sidebar not found');
    }
}

function getOsmEditLink(id) {
    return `https://www.openstreetmap.org/edit?editor=id&node=${id}`;
}

function createSidebar(properties) {
    let sidebarCaption = document.getElementById('sidebar-caption');
    let sidebarTitle = document.getElementById('poi-title');
    let sidebarContent = document.getElementsByClassName('content')[0];
    let sidebarHeader = document.getElementById('sidebar-header');
    sidebarContent.innerHTML = '';
    sidebarHeader.classList = [];
    let sidebarLink = document.getElementsByClassName('card-footer-item')[0];
    sidebarHeader.classList.add(defineColor(properties.access));
    sidebarCaption.innerHTML = `defibrylator AED ${defineAccessDescription(properties.access)}`;
    // PRESENTATION
    sidebarContent.innerHTML = ` 
        <p class="has-text-weight-light">Wewnątrz budynku?: <span class="add-new has-text-weight-medium">${defineIndoor(properties.indoor) || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></span>`}</span></p>
        <p class="has-text-weight-light">Dokładna lokalizacja: <span class="add-new has-text-weight-medium">${properties['defibrillator:location:pl'] || properties['defibrillator:location'] || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></span>`}</span></p>
        <p class="has-text-weight-light">Dostępny w godzinach: <span class="add-new has-text-weight-medium">${defineOpeningHours(properties.opening_hours) || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></span>`}</span></p>
        <p class="has-text-weight-light">Opis: <span class="add-new has-text-weight-medium">${properties['description:pl'] || properties.description || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></span>`}</span></p>
        <p class="has-text-weight-light">Numer kontaktowy: <span class="add-new has-text-weight-medium">${properties.phone || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></span>`}</span></p>
    `;
    
    if (properties.note || properties['note:pl'])
    {
        sidebarContent.innerHTML += `<p class="has-text-weight-light">Uwagi: <span class="add-new has-text-weight-medium">${properties['note:pl'] || properties.note || 'brak uwag'}</span></p>`;
    }

    sidebarLink.setAttribute("href", getOsmEditLink(properties.osm_id));
}

map.on('load', () => {
    map.loadImage('./aed_240px.png', (error, image) => {
        if (error) throw error;
        map.addImage('aed-icon', image, {
            'sdf': false
        });
        map.addSource('aed-locations', {
            'type': 'geojson',
            'data': './aed_poland.geojson',
            'cluster': true,
        });
        map.addLayer({
            'id': 'unclustered',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'icon-image': ['image', 'aed-icon'],
                'icon-size': 0.1,
            },
            'filter': ['!', ['has', 'point_count']],
        });
        map.addLayer({
            'id': 'clustered-circle',
            'type': 'circle',
            'source': 'aed-locations',
            'paint': {
                'circle-color': '#008954',//'rgba(204, 255, 51, 0.72)',
                'circle-radius': 26,
                'circle-stroke-color': '#f5f5f5',//'#fff',
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
                showSidebar(e.features[0].properties);
            }
        });
        map.on('click', function (e) {
            let sidebar = document.getElementsByClassName('sidebar')[0];
            
            if (!sidebar.classList.contains('is-invisible')) {
               //  sidebar.classList.add('is-invisible');
            }
        });
        
        map.on('mouseenter', 'unclustered', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'unclustered', () => {
            map.getCanvas().style.cursor = '';
            });
    });
});