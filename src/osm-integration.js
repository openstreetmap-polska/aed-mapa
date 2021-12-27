// osm integration stuff
var auth = osmAuth({
    oauth_consumer_key: 'SVN3D2Q8ciaIbHCdHbhuiG7mEwvOGbnSDcy1ZgnV',
    oauth_secret: 'alqjD88o2qtdN9ZwtOfanqqu5Rbp2lhIxbGFukTD',
    url: "https://master.apis.dev.openstreetmap.org",
    landing: 'land.html',

});
var openChangesetId = null;
var marker = null;

function getOpenChangesetId() {
    return new Promise((resolve, reject) => {
        if (openChangesetId !== null) {
            resolve(openChangesetId);
        } else {
            let data = '<osm><changeset><tag k="comment" v="#aed Defibrillator added via https://aed.openstreetmap.org.pl"/></changeset></osm>';
            auth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                content: data,
                options: {header: {"Content-Type": "text/xml"}},
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    openChangesetId = res;
                    console.log('api returned changeset id: ' + res);
                    resolve(res);
                }
            })
        }
    })
}

function done(err, res) {
    if (err) {
        document.getElementById('user').innerHTML = 'error! try clearing your browser cache';
        document.getElementById('user').style.display = 'block';
        return;
    }
    var u = res.getElementsByTagName('user')[0];
    var changesets = res.getElementsByTagName('changesets')[0];
    var o = {
        display_name: u.getAttribute('display_name'),
        id: u.getAttribute('id'),
        count: changesets.getAttribute('count')
    };
    for (var k in o) {
        document.getElementById(k).innerHTML = o[k];
    }
    document.getElementById('user').style.display = 'block';
}

document.getElementById('authenticate').onclick = function() {
    if (!auth.bringPopupWindowToFront()) {
        auth.authenticate(function() {
            update();
        });
    }
};

function showDetails() {
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
    }, done);
}

function log_xhr(err, res) {
    if (err) console.log(err);
    console.log(res);
}

function addDefibrillatorToOSM(changesetId, data) {
    console.log('sending request to create node in changeset: ' + changesetId);
    var data = `<osm><node changeset="${changesetId}" lat="${data.lat}" lon="${data.lng}"><tag k="emergency" v="defibrillator"/>`;
    // todo: add tags data
    data += `</node></osm>`;
    console.log(data);
//    auth.xhr({
//        method: 'PUT',
//        path: '/api/0.6/node/create',
//        content: data,
//        options: {header: {"Content-Type": "text/xml"}},
//    }, log_xhr);
}

document.getElementById('addNode').onclick = function() {
//    getOpenChangesetId().then(changesetId => addDefibrillatorToOSM(changesetId));
    // add marker
    const mapCenter = map.getCenter();
    const initialCoordinates = [mapCenter.lng, mapCenter.lat];
    if (marker !== null) marker.remove();
    marker = new maplibregl.Marker({
        draggable: true
    })
    .setLngLat(initialCoordinates);
    marker.addTo(map);
    let properties = {
        action: "addNode",
        data: {},
    };
    showSidebar(properties);
};

function hideDetails() {
    document.getElementById('user').style.display = 'none';
}

document.getElementById('logout').onclick = function() {
    auth.logout();
    update();
};

function update() {
    if (auth.authenticated()) {
        document.getElementById('authenticate').className = 'done';
        document.getElementById('logout').className = '';
        showDetails();
    } else {
        document.getElementById('authenticate').className = '';
        document.getElementById('logout').className = 'done';
        hideDetails();
    }
}

update();
