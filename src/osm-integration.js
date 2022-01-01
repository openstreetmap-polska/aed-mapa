// osm integration stuff
var auth = osmAuth({
    oauth_consumer_key: 'BR73INeC1mlLMrxHyNFMj7tm4UxlfEmfyc9VlVEn',
    oauth_secret: 'BR73INeC1mlLMrxHyNFMj7tm4UxlfEmfyc9VlVEn',
    url: "https://www.openstreetmap.org",
    landing: 'land.html',

});
// global variables
var openChangesetId = null;
var marker = null;

// --------------------------------------------------------------------------------------
function getOpenChangesetId() {
    return new Promise((resolve, reject) => {
        if (openChangesetId !== null) {
            resolve(openChangesetId);
        } else {
            let data = '<osm><changeset>' +
                '<tag k="comment" v="Defibrillator added via https://aed.openstreetmap.org.pl #aed"/>' +
                '<tag k="created_by" v="https://aed.openstreetmap.org.pl"/>' +
                '<tag k="locale" v="pl"/>' +
                '<tag k="hashtags" v="#aed"/>' +
                '</changeset></osm>';
            auth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                content: data,
                options: {
                    header: {
                        "Content-Type": "text/xml"
                    }
                },
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    openChangesetId = res;
                    console.log('Api returned changeset id: ' + res);
                    resolve(res);
                }
            })
        }
    })
}

function getNodeUrl(nodeId) {
    return `${auth.options().url}/node/${nodeId}`;
}

function renderModalMessage(newNodeUrl) {
    return `
    <p>AED dodany z powodzeniem: <a target="_blank" rel="noopener" href="${newNodeUrl}">${newNodeUrl}</a></p>
            
            <p>Powinien być widoczny na mapie w ciągu maksymalnie 60 minut.</p>`;
}

function renderModalErrorMessage(message) {
    return `<p>Wystąpił błąd: ${message}</p>`;
}

function renderModalNeedLoginMessage() {
    return `<p>Żeby dodawać obiekty musisz się zalogować kontem OSM.</p>
    ${renderLoginButton()}
    `;
}

function renderModalNeedMoreZoomMessage() {
    return `<p>Żeby dodawać obiekty musisz bardziej przybliżyć mapę, żeby podana lokalizacja była możliwie dokładna.</p>`;
}

function showNeedMoreZoomModal() {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalNeedMoreZoomMessage();
    openModal();
}

function showNeedLoginModal() {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalNeedLoginMessage();
    openModal();
}

function showSuccessModal(newNodeId) {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalMessage(getNodeUrl(newNodeId));
    openModal();
}

function showFailureModal(message) {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalErrorMessage(message);
    openModal();
}

function openModal() {
    let modal = document.getElementById('modal-div');
    modal.classList.add('is-clipped');
    modal.classList.add('is-active');
}

function closeModal() {
    // close modal
    let modal = document.getElementById('modal-div');
    modal.classList.remove('is-clipped');
    modal.classList.remove('is-active');
    // remove marker and close sidebar too
    let sidebar = document.getElementById('sidebar-div');
    if (sidebar) {
        // hide sidebar
        sidebar.classList.add('is-invisible');
        // remove marker
        if (marker !== null) {
            marker.remove();
            marker = null;
        }
        // restore buttons
        let mobileButton1 = document.getElementById('addNode-mobile-1');
        let mobileButton2 = document.getElementById('addNode-mobile-2');
        let mobileButton3 = document.getElementById('addNode-mobile-3');
        mobileButton1.classList.remove('is-hidden');
        mobileButton2.classList.add('is-hidden');
        mobileButton3.classList.add('is-hidden');
    } else {
        console.log('sidebar not found.');
    }
}

function addDefibrillatorToOSM(changesetId, data) {
    return new Promise((resolve, reject) => {
        console.log('sending request to create node in changeset: ' + changesetId);
        var xml = `<osm><node changeset="${changesetId}" lat="${data.lat}" lon="${data.lng}">`;
        xml += `<tag k="emergency" v="defibrillator"/>`;
        xml += Object.entries(data.tags).map(arr => `<tag k="${arr[0]}" v="${arr[1]}"/>`).join('');
        xml += `</node></osm>`;
        console.log('payload: ' + xml);
        auth.xhr({
            method: 'PUT',
            path: '/api/0.6/node/create',
            content: xml,
            options: {
                header: {
                    "Content-Type": "text/xml"
                }
            },
        }, (err, res) => {
            if (err) reject(err);
            else {
                resolve(res);
                console.log(`response: ${res}`);
            }
        });
    })
}

function startSaveButtonAnimation() {
    let saveButton = document.getElementById('sidebar-save-button');
    saveButton.classList.add('is-loading');
    saveButton.disabled = true;
}

function stopSaveButtonAnimation() {
    let saveButton = document.getElementById('sidebar-save-button');
    saveButton.classList.remove('is-loading');
    saveButton.disabled = false;
}

function saveNode(data) {
    startSaveButtonAnimation();
    getOpenChangesetId()
        .then(changesetId => {
            return addDefibrillatorToOSM(changesetId, data);
        })
        .then(newNodeId => {
            stopSaveButtonAnimation();
            showSuccessModal(newNodeId);
        })
        .catch(err => {
            stopSaveButtonAnimation();
            console.log(err);
            showFailureModal(err);
        });
}

document.getElementById('addNode').onclick = function () {
    // add marker
    const mapCenter = map.getCenter();
    const initialCoordinates = [mapCenter.lng, mapCenter.lat];
    if (marker !== null) marker.remove();
    marker = new maplibregl.Marker({
            draggable: true,
            color: "#e81224",
        })
        .setLngLat(initialCoordinates);
    marker.addTo(map);
    // show sidebar
    let properties = {
        action: "addNode",
        data: {},
    };
    showSidebar(properties);
};

function mobileButton1onClick() {
    // add marker
    const mapCenter = map.getCenter();
    const initialCoordinates = [mapCenter.lng, mapCenter.lat];
    if (marker !== null) marker.remove();
    marker = new maplibregl.Marker({
            draggable: true,
            color: "#e81224",
        })
        .setLngLat(initialCoordinates);
    marker.addTo(map);
    // swap buttons
    let mobileButton1 = document.getElementById('addNode-mobile-1');
    let mobileButton2 = document.getElementById('addNode-mobile-2');
    let mobileButton3 = document.getElementById('addNode-mobile-3');
    mobileButton1.classList.add('is-hidden');
    mobileButton2.classList.remove('is-hidden');
    mobileButton3.classList.remove('is-hidden');
};
document.getElementById('addNode-mobile-1').onclick = mobileButton1onClick;

document.getElementById('addNode-mobile-2').onclick = function () {
    // show sidebar
    let properties = {
        action: "addNode",
        data: {},
    };
    showSidebar(properties);
    // hide buttons
    let mobileButton2 = document.getElementById('addNode-mobile-2');
    let mobileButton3 = document.getElementById('addNode-mobile-3');
    mobileButton2.classList.add('is-hidden');
    mobileButton3.classList.add('is-hidden');
};

document.getElementById('addNode-mobile-3').onclick = function () {
    // remove marker if exists
    if (marker !== null) marker.remove();
    // restore buttons
    let mobileButton1 = document.getElementById('addNode-mobile-1');
    let mobileButton2 = document.getElementById('addNode-mobile-2');
    let mobileButton3 = document.getElementById('addNode-mobile-3');
    mobileButton1.classList.remove('is-hidden');
    mobileButton2.classList.add('is-hidden');
    mobileButton3.classList.add('is-hidden');
}

function updateNavbarLoggedUserState() {
    let navbar = document.getElementById('navbar-logged');

    if (!auth.authenticated()) {
        navbar.classList.add('is-hidden');
    }
    else {
        navbar.classList.remove('is-hidden');
    }
}

function logoutAction() {
    auth.logout();
    update();
};

document.getElementById('logout').onclick = logoutAction;

function authenticateAction() {
    if (!auth.bringPopupWindowToFront()) {
        auth.authenticate(function() {
            update();
            closeModal();
        });
    }
}

function renderLoginButton() {
    return '<button class="button is-success has-text-weight-light is-outlined" onclick="authenticateAction()">Zaloguj kontem OSM</button>';
}

function renderUserLoggedIn(username) {
    return `<svg class="icon mr-1" style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
            </svg> ${username}`;
}

function renderErrorLoggingIn() {
    return '<p>Problem podczas logowania. Spróbuj wyczyścić cache (ctrl+f5).</p>';
}

function updateAddNodeButtonState() {
    let addNodeButton = document.getElementById('addNode');
    let mobileButton1 = document.getElementById('addNode-mobile-1');
    addNodeButton.disabled = false;
    addNodeButton.title = "";
    mobileButton1.onclick = mobileButton1onClick;
    if (!auth.authenticated()) {
        addNodeButton.disabled = true;
        addNodeButton.title = "Zaloguj się aby móc dodawać obiekty";
        mobileButton1.onclick = showNeedLoginModal;
    }
    if (map.getZoom() < 15) {
        addNodeButton.disabled = true;
        addNodeButton.title = "Zbyt duże oddalenie mapy";
        mobileButton1.onclick = showNeedMoreZoomModal;
    }
}

map.on('zoomend', updateAddNodeButtonState);

function update() {
    if (auth.authenticated()) {
        auth.xhr({
            method: 'GET',
            path: '/api/0.6/user/details'
        }, (err, res) => {
            if (err) {
                updateAddNodeButtonState();
                showFailureModal(err);
            } else {
                const u = res.getElementsByTagName('user')[0];
                const user_name = u.getAttribute('display_name');
                const user_with_id = `${user_name}`;
                document.getElementById('span-login').innerHTML = '';
                document.getElementById('span-login').classList.add('is-hidden');
                document.getElementById('navbar-username').innerHTML = renderUserLoggedIn(user_with_id);
                updateAddNodeButtonState();
                updateNavbarLoggedUserState();
            }
        });
    } else {
        document.getElementById('span-login').innerHTML = renderLoginButton();
        updateAddNodeButtonState();
        updateNavbarLoggedUserState();
    }
}

update();
