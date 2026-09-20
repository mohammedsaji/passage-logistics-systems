const params = new URLSearchParams(window.location.search);
let currentPageNo = 1;
let totalPages = 1;
let currentResponse = null;
let isDriver = null;

async function payloadExtractor() {
    const userAction = params.get("userAction");

    if (!userAction) {
        alert('User action did not specified.');
        return;
    }

    const loginUserMap = await ajaxCall(`/logistic/account/user-info`, 'GET', null);
    isDriver = loginUserMap.data.RoleList.includes("FEDERATE-DRIVER");

    currentPageNo = 1;
    await fetchShipmentList(currentPageNo, isDriver);

}
payloadExtractor();

async function fetchShipmentList(pageNo, isDriver) {
    const url = isDriver ? `/logistic/shipment/fetchmine` : `/logistic/shipment/fetchall?pageNo=${pageNo}`;
    const methodType = 'GET';
    const response = await ajaxCall(url, methodType, null);

    currentResponse = response;

    if (response && response.data) {
        const loginUserMap = await ajaxCall(`/logistic/account/user-info`, 'GET', null);
        const roleArray = loginUserMap?.data?.RoleList;
        if(roleArray && roleArray.length > 0){
            dynamicLayoutRender(roleArray);
            if(isDriver){
                renderShipmentList(response.data, isDriver);
            }else{
                const shipmentList = Array.isArray(response.data.shipmentList) ? response.data.shipmentList : [response.data.shipmentList];
                totalPages = response.data.totalPages;
                renderShipmentList(shipmentList, isDriver);
            }
        }
    }
}

function renderShipmentList(shipmentList, isDriver) {
    const listContainer = document.getElementById('shipment-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }

    shipmentList.forEach(shipment => {
        if (!shipment) return;

        const shipmentDiv = document.createElement('div');
        shipmentDiv.className = 'shipment-list-item';
        shipmentDiv.setAttribute('data-shipping-id', shipment.shippingId);
        shipmentDiv.setAttribute('data-shipment-from', shipment.shippingFrom);
        shipmentDiv.setAttribute('data-shipment-to', shipment.shippingTo);

        const shipmentInnerDivA = document.createElement('div');
        shipmentInnerDivA.className = 'shipment-inner-div-a';

        const shippingIdP = document.createElement('p');
        shippingIdP.className = 'shipment-id-display';
        shippingIdP.textContent = `Shipping Id : ${shipment.shippingId}`;
        shipmentInnerDivA.append(shippingIdP);

        const shipmentFromP = document.createElement('p');
        shipmentFromP.className = 'shipment-from-display';
        shipmentFromP.textContent = `From : ${shipment.shippingFrom}`;
        shipmentInnerDivA.append(shipmentFromP);

        const shipmentToP = document.createElement('p');
        shipmentToP.className = 'shipment-to-display';
        shipmentToP.textContent = `To : ${shipment.shippingTo}`;
        shipmentInnerDivA.append(shipmentToP);

        const shipmentInnerDivB = document.createElement('div');
        shipmentInnerDivB.className = 'shipment-inner-div-b';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.setAttribute('data-shipping-id', shipment.shippingId);
        viewBtn.textContent = 'View';

        viewBtn.addEventListener('click', function () {
            const shippingId = this.getAttribute('data-shipping-id');
            const userAction = params.get("userAction");
            window.location.href = `../../views/shipment/shipment.html?shippingId=${shippingId}&userAction=${userAction}`;
        }, { once: true });

        shipmentInnerDivB.append(viewBtn);

        shipmentDiv.append(shipmentInnerDivA);
        shipmentDiv.append(shipmentInnerDivB);
        listContainer.append(shipmentDiv);
    });
}

function dynamicLayoutRender(roleArray){
    const shipmentHeaderSectionDivB = document.querySelector('.shipment-header-section-b');
    if(roleArray.length > 0 && !roleArray.includes("ADMIN") && shipmentHeaderSectionDivB){
        shipmentHeaderSectionDivB.remove();
    }
}

function clickEventBinder() {
    const userAction = params.get("userAction");

    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function () {
            window.location.href = "/views/dashboard.html";
        }, { once: true });
    }

    const createShipmentBtn = document.getElementById('create-shipment-btn');
    if (createShipmentBtn) {
        createShipmentBtn.addEventListener('click', function () {
            window.location.href = `../../views/operator/transport-types.html?userAction=Entry shipping`;
        }, { once: true });
    }

    const previousPageBtn = document.getElementById('previous-page-btn');
    if (previousPageBtn) {
        previousPageBtn.addEventListener('click', async function () {
            if (currentPageNo > 1) {
                currentPageNo--;
                await fetchShipmentList(currentPageNo, isDriver);
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page-btn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async function () {
            if (currentPageNo < totalPages) {
                currentPageNo++;
                await fetchShipmentList(currentPageNo, isDriver);
            }
        });
    }
}
clickEventBinder();

function searchClickEvent() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search');

    if (searchBtn) {
        searchBtn.addEventListener('click', async function () {
            const searchValue = searchInput.value.trim();
            const shipmentItems = document.querySelectorAll('.shipment-list-item');
            let hasMatch = false;

            shipmentItems.forEach(item => {
                const shippingId = item.getAttribute('data-shipping-id');
                if (parseInt(shippingId, 10) === parseInt(searchValue, 10) || searchValue === '') {
                    item.style.display = '';
                    hasMatch = true;
                } else {
                    item.style.display = 'none';
                }
            });

            if (!hasMatch && searchValue !== '') {
                const response = await ajaxCall(`/logistic/shipment/fetch?shippingId=${searchValue}`, 'GET', null);
                if (response) {
                    let shipmentList = [];

                    // Handle both response formats: valueMap wrapper and direct array
                    if (response && response.data.valueMap) {
                        shipmentList = response.data.valueMap.ShipmentList || [];
                    } else if (Array.isArray(response)) {
                        shipmentList = response.data;
                    } else if (response) {
                        shipmentList = [response.data];
                    }

                    if (shipmentList.length > 0) {
                        renderShipmentList(shipmentList, isDriver);
                    }
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchValue = this.value.trim();

            if (!searchValue) {
                const shipmentItems = document.querySelectorAll('.shipment-list-item');
                shipmentItems.forEach(item => {
                    item.style.display = '';
                });
            }
        });
    }
}
searchClickEvent();

function shipmentNavigationBinder() {
    const shipmentNavigationBtn = document.getElementById('shipment-navigation-btn');

    if (shipmentNavigationBtn) {
        shipmentNavigationBtn.addEventListener('click', function () {
            toggleShipmentNavigationMenu();
        });
    }
}

shipmentNavigationBinder();

function toggleShipmentNavigationMenu() {
    const shipmentNavigationMenu = document.getElementById('shipment-navigation-menu');

    if (!shipmentNavigationMenu) {
        return;
    }

    shipmentNavigationMenu.classList.toggle('active');
}