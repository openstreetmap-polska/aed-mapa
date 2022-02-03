const sidebarDivId = 'sidebar-div';
const sidebar2DivId = 'sidebar2-div';
const sidebarHeaderId = 'sidebar-header';
const sidebarCaptionId = 'sidebar-caption';
const sidebarContentDivId = 'sidebar-content-div';
const sidebarFooterButtonLeftId = 'sidebar-footer-button-left';
const sidebarButtonCloseIds = ['sidebar-button-close-touch', 'sidebar-button-close-desktop'];
const sidebar2ButtonCloseIds = ['sidebar2-button-close-touch', 'sidebar2-button-close-desktop'];
const formPhoneFieldId = 'form-phone';
const formLocationFieldId = 'form-location';
const formLocationEnFieldId = 'form-location-en';
const formIndoorFieldId = 'form-indoor';
const formEmergencyPhoneFieldId = 'form-emergency-phone';

let sidebarHeader = document.getElementById(sidebarHeaderId);
let sidebarCaption = document.getElementById(sidebarCaptionId);
let sidebarContent = document.getElementById(sidebarContentDivId);
let sidebarLink = document.getElementById(sidebarFooterButtonLeftId);

const accessToColourMapping = {
    'yes': 'has-background-green',
    'no': 'has-background-grey',
    'private': 'has-background-grey',
    'permissive': 'has-background-link-dark',
    'default': 'has-background-grey',
};

const accessToDescriptionMapping = {
    'yes': 'ogólnodostępny',
    'no': 'prywatny',
    'private': 'prywatny',
    'permissive': 'o ograniczonym dostępie',
    'default': '',
};

const indoorMapping = {
    'yes': 'tak',
    'no': 'nie',
    'default': '',
};

const locationMapping = {
    'indoor': 'tak',
    'outdoor': 'nie',
    'default': '',
};

// --------------------------------------------------------------------------------------
function defineColor(access) {
    return accessToColourMapping[access] || accessToColourMapping['default'];
}

function defineAccessDescription(access) {
    return accessToDescriptionMapping[access] || accessToDescriptionMapping['default'];
}

function defineIndoor(indoor) {
    return indoorMapping[indoor] || indoorMapping['default'];
}

function defineLocationIndoor(location) {
    return locationMapping[location] || locationMapping['default'];
}

function getOsmEditLink(id) {
    return `https://www.openstreetmap.org/edit?editor=id&node=${id}`;
}

function getOsmPreviewLink(id) {
    return `https://www.openstreetmap.org/node/${id}`;
}

function parseOpeningHours(openingHours) {

    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return 'całodobowo';
        } else {
            let hoursPrettified;

            try {
                let hours = openingHours.toString();
                let oh = new opening_hours(hours, undefined, 2);
                isOpen = oh.getState();
                hoursPrettified = oh.prettifyValue({
                    conf: {
                        locale: 'pl'
                    },
                });

            } catch (error) {
                console.log('Error when parsing opening hours');
                return undefined;
            }

            return hoursPrettified;
        }
    } else {
        return undefined;
    }
}

function isCurrentlyOpen(openingHours) {
    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return true;
        } else {
            let hours = openingHours.toString();
            let oh = new opening_hours(hours, undefined, 2);
            isOpen = oh.getState();
            return isOpen;
        }
    }
}

function renderCurrentlyOpenStatus(openingHours) {
    if (isCurrentlyOpen(openingHours)) {
        return '<sup class="pl-1"><span class="tag is-success is-light">Dostępny</span></sup>';
    } else {
        return '<sup class="pl-1"><span class="tag is-danger is-light">Niedostępny</span></sup>';
    }
}

function renderIfIndoor(indoor, location) {
    let beginning = '<p class="has-text-weight-light">Wewnątrz budynku?: <span class="add-new has-text-weight-medium">';
    let middle = defineLocationIndoor(location) || defineIndoor(indoor) || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderLocation(properties) {
    let beginning = '<p class="has-text-weight-light">Dokładna lokalizacja: <span class="add-new has-text-weight-medium">';
    let middle = properties['defibrillator:location:pl'] || properties['defibrillator:location'] || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderDescription(properties) {
    let beginning = '<p class="has-text-weight-light">Opis: <span class="add-new has-text-weight-medium">';
    let middle = properties['description:pl'] || properties.description || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderContactNumber(phone) {
    let beginning = '<p class="has-text-weight-light">Numer kontaktowy: <span class="add-new has-text-weight-medium">';
    let middle = phone || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderAccessibleTime(openingHours) {
    if (openingHours) {
        let beginning = '<p class="has-text-weight-light">Dostępny w godzinach: <span class="add-new has-text-weight-medium">';
        let middle = parseOpeningHours(openingHours) || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji </span>';
        let end = (renderCurrentlyOpenStatus(openingHours) || '') + '</span></p>';
        return beginning + middle + end;
    } else {
        return '';
    }
}

function renderNotes(properties) {
    if (properties.note || properties['note:pl']) {
        let beginning = '<p class="has-text-weight-light">Uwagi: <span class="add-new has-text-weight-medium">';
        let middle = properties['note:pl'] || properties.note || 'brak uwag';
        let end = '</span></p>';
        return beginning + middle + end;
    } else {
        return '';
    }
}

function renderSidebarContent(properties) {
    let content = '';
    content += renderIfIndoor(properties.indoor, properties.location);
    content += renderLocation(properties);
    content += renderAccessibleTime(properties.opening_hours);
    content += renderDescription(properties);
    content += renderContactNumber(properties.phone);
    content += renderNotes(properties);
    return content;
}

function renderSidebarForm() {
    let content = `
    <form>
    <label class="label has-text-weight-semibold">Rodzaj dostępności:</label>
    <div class="field">
        <input class="is-checkradio is-success" id="accessRadio1" type="radio" name="aedAccess" value="yes" tag="access">
        <label for="accessRadio1">Publicznie dostępny</label>
    </div>
    <div class="field">
        <input class="is-checkradio is-success" id="accessRadio2" type="radio" name="aedAccess" value="private" tag="access">
        <label for="accessRadio2">Dostępny za zgodą właściciela</label>
    </div>
    <div class="field">
        <input class="is-checkradio is-success" id="accessRadio3" type="radio" name="aedAccess" value="customers" tag="access">
        <label for="accessRadio3">Dostępny tylko w godzinach pracy</label>
    </div>

    <label class="label has-text-weight-semibold pt-2">Czy wewnątrz budynku?</label>
    <div class="field">
        <input class="is-checkradio is-success" id="indoorRadio1" type="radio" name="aedIndoor" value="no" tag="indoor">
        <label for="indoorRadio1">Na zewnątrz</label>    
        <input class="is-checkradio is-success" id="indoorRadio2" type="radio" name="aedIndoor" value="yes" tag="indoor">
        <label for="indoorRadio2">W budynku</label>
    </div>

    <div class="field pt-2">
      <label class="label has-text-weight-semibold">Szczegółowy opis lokalizacji defibrylatora</label>
      <div class="control">
        <textarea id="${formLocationFieldId}" tag="defibrillator:location" class="textarea is-success" rows="1"
            placeholder="Na przykład: Na ścianie przy wejściu"></textarea>
      </div>
    </div>
    <div class="field">
    <label class="label has-text-weight-semibold">Opis lokalizacji defibrylatora po angielsku</label>
    <div class="control">
      <textarea id="${formLocationEnFieldId}" tag="defibrillator:location:en" class="textarea is-success" rows="1"
          placeholder="For example: On the wall near entrance"></textarea>
    </div>
    <p class="help has-text-weight-light">Pole opcjonalne</p>
  </div>
    <div class="field-body">
    <div class="field">
      <label class="label has-text-weight-semibold">Telefon kontaktowy operatora</label>
      <div class="control">
        <input id="${formPhoneFieldId}" tag="phone" class="input is-success" type="text" placeholder="+48 123 456 789"
          pattern="^[+][0-9]{2}[ ]?((?:[0-9]{9})|(?:[0-9]{3} [0-9]{3} [0-9]{3})|(?:[0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}))$">
      </div>
      <p class="help has-text-weight-light">Pole opcjonalne</p>
    </div>

    <div class="field">
      <label class="label has-text-weight-semibold">Numer ratunkowy danego obszaru</label>
      <div class="control">
        <input id="${formEmergencyPhoneFieldId}" tag="emergency:phone" class="input is-success" type="text" placeholder="+48 123 456 789"
          pattern="^[+][0-9]{2}[ ]?((?:[0-9]{9})|(?:[0-9]{3} [0-9]{3} [0-9]{3})|(?:[0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}))$">
      </div>
      <p class="help has-text-weight-light">Pole opcjonalne. Wypełnij tylko, jeżeli jest inny niż 112/999.</p>
    </div>
    </div>

    <form>
    `;
    return content;
}

function renderEditButton(osm_id) {
    return `
    <a href="${getOsmEditLink(osm_id)}" id="edit-poi" class="button is-small is-pulled-right is-success">
      <svg class="icon" viewBox="0 0 24 24">
        <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
      </svg>
     Uzupełnij dane&nbsp;<sup class="has-text-weight-light">(iD)</sup>
     </button>`;
}

function renderPreviewButton(osm_id) {
    return `
        <a href="${getOsmPreviewLink(osm_id)}" id="preview-poi" class="button is-small mr-1 is-pulled-right is-success">
            <svg class="icon mr-1" viewBox="0 0 24 24">
                <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
            Podgląd w OSM
        </button>`;
}

function renderSaveButton() {
    return `
        <button id="sidebar-save-button" class="button is-success is-fullwidth" onclick="saveNode(prepareNodeData())">
            Dodaj AED
        </button> 
        <div class="is-hidden-desktop">
            <span class="has-text-weight-light has-text-grey-light is-size-7 pt-1 is-pulled-right">ver. 0.1</span>
        </div>`;
}

// --------------------------------------------------------------
function prepareNodeData() {
    let data = {};
    // get coordinates
    let markerPosition = marker.getLngLat();
    data.lng = markerPosition.lng;
    data.lat = markerPosition.lat;
    // get additional tags
    data.tags = {};
    let formPhoneField = document.getElementById(formPhoneFieldId);
    let formLocationField = document.getElementById(formLocationFieldId);
    let formEmergencyPhoneField = document.getElementById(formEmergencyPhoneFieldId);
    let formLocationEnField = document.getElementById(formLocationEnFieldId);
    let formAccessField = document.querySelector('input[name="aedAccess"]:checked');
    let formIndoorField = document.querySelector('input[name="aedIndoor"]:checked');
    if (formIndoorField && formIndoorField.getAttribute('value'))
        data.tags[formIndoorField.getAttribute('tag')] = formIndoorField.getAttribute('value');
    if (formPhoneField && formPhoneField.value.trim()) data.tags[formPhoneField.getAttribute('tag')] = formPhoneField.value.trim();
    if (formLocationField && formLocationField.value.trim()) data.tags[formLocationField.getAttribute('tag')] = formLocationField.value.trim();
    if (formEmergencyPhoneField && formEmergencyPhoneField.value.trim()) data.tags[formEmergencyPhoneField.getAttribute('tag')] = formEmergencyPhoneField.value.trim();
    if (formLocationEnField && formLocationEnField.value.trim()) data.tags[formLocationEnField.getAttribute('tag')] = formLocationEnField.value.trim();
    if (formAccessField && formAccessField.getAttribute('value'))
        data.tags[formAccessField.getAttribute('tag')] = formAccessField.getAttribute('value');

    return data;
}

function removeMarkerIfExists() {
    if (marker !== null) {
        marker.remove();
        marker = null;
    }
}

function closeNavBurger() {
    document.getElementById('navMenu').classList.remove('is-active');
    document.getElementsByClassName('navbar-burger')[0].classList.remove('is-active');
}

function showSidebar(properties) {
    let sidebar = document.getElementById(sidebarDivId);
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        if (properties.action === "showDetails") {
            prepareSidebarShowingObjectInfo(properties.data);
            removeMarkerIfExists();
        } else if (properties.action === "addNode") {
            prepareSidebarAddingNode(properties.data);
        } else {
            console.log(`Unknown action: ${properties.action}.`);
        }
        hideSidebar2();
        closeNavBurger();
    } else
        console.log('Sidebar not found.');
}

function showSidebar2() {
    let sidebar = document.getElementById(sidebar2DivId);
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        hideSidebar();
        closeNavBurger();
    } else
        console.log('Sidebar not found.');
}

function hideSidebar() {
    let sidebar = document.getElementById(sidebarDivId);
    if (sidebar) {
        sidebar.classList.add('is-invisible');
        removeMarkerIfExists();
        // restore buttons
        let mobileButton1 = document.getElementById('addNode-mobile-1');
        let mobileButton2 = document.getElementById('addNode-mobile-2');
        let mobileButton3 = document.getElementById('addNode-mobile-3');
        mobileButton1.classList.remove('is-hidden');
        mobileButton2.classList.add('is-hidden');
        mobileButton3.classList.add('is-hidden');
    } else {
        console.log('Sidebar not found.');
    }
}

function hideSidebar2() {
    let sidebar = document.getElementById(sidebar2DivId);
    if (sidebar) {
        sidebar.classList.add('is-invisible');
    } else {
        console.log('Sidebar not found.');
    }
}

function prepareSidebarShowingObjectInfo(properties) {
    sidebarHeader.classList = ['p-2'];
    sidebarHeader.classList.add(defineColor(properties.access));
    sidebarCaption.innerHTML = `defibrylator AED ${defineAccessDescription(properties.access)}`;

    sidebarContent.innerHTML = renderSidebarContent(properties);

    sidebarLink.innerHTML = renderEditButton(properties.osm_id);
    sidebarLink.innerHTML += renderPreviewButton(properties.osm_id);
}

function prepareSidebarAddingNode(properties) {
    sidebarHeader.classList = ['p-2'];
    sidebarHeader.classList.add(defineColor('default'));
    sidebarCaption.innerHTML = 'Dodaj defibrylator';

    sidebarContent.innerHTML = renderSidebarForm();

    sidebarLink.innerHTML = renderSaveButton();
}

// --------------------------------------------------------------------------------------
// Bulma controls
document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {

        // Add a click event on each of them
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {

                // Get the target from the "data-target" attribute
                const target = el.dataset.target;
                const $target = document.getElementById(target);

                // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');

            });
        });
    }

    // add listeners to buttons opening modals
    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', () => {
            $target.classList.add('is-active');
        });
    });

    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
        const $target = $close.closest('.modal');

        $close.addEventListener('click', () => {
            $target.classList.remove('is-active');
        });
    });

});
// button listeners
sidebarButtonCloseIds.forEach(id => {
    document.getElementById(id).addEventListener('click', hideSidebar);
});
sidebar2ButtonCloseIds.forEach(id => {
    document.getElementById(id).addEventListener('click', hideSidebar2);
});
