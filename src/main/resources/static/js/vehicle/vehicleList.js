const params = new URLSearchParams(window.location.search);
let currentPageNo = 1;
let totalPages = 1;
let currentResponse = null;

async function payloadExtractor() {
    const userAction = params.get("userAction");
    const operatorId = params.get("operatorId");

    if (!userAction || !operatorId) {
        alert('Invalid parameters.');
        return;
    }

    currentPageNo = 1;
    await fetchVehicleList(operatorId, currentPageNo);
}
payloadExtractor();

async function fetchVehicleList(operatorId, pageNo) {
    const url = `/logistic/vehicle/fetchall?operatorId=${operatorId}&pageNo=${pageNo}`;
    const methodType = 'GET';
    const response = await ajaxCall(url, methodType, null);

    currentResponse = response;

    if (response && response.data) {
        const loginUserMap = await ajaxCall(`/logistic/account/user-info`, 'GET', null);
        const roleArray = loginUserMap?.data?.RoleList;
        if(roleArray && roleArray.length > 0){
            dynamicLayoutRender(roleArray);
            const vehicleList = Array.isArray(response.data.vehicleList) ? response.data.vehicleList : [response.data.vehicleList];
            totalPages = response.data.totalPages;
            renderVehicleList(vehicleList);
        }
    }
}

function renderVehicleList(vehicleList) {
    const userAction = params.get("userAction");
    const driverId = params.get("driverId");

    const listContainer = document.getElementById('vehicle-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }

    vehicleList.forEach(vehicle => {
        if (!vehicle) return;

        const vehicleDiv = document.createElement('div');
        vehicleDiv.className = 'vehicle-list-item';
        vehicleDiv.setAttribute('data-vehicle-id', vehicle.vehicleId);
        vehicleDiv.setAttribute('data-vehicle-number', vehicle.vehicleNumber);
        vehicleDiv.setAttribute('data-operator-id', vehicle.operatorId);

        const vehicleInnerDivA = document.createElement('div');
        vehicleInnerDivA.className = 'vehicle-inner-div-a';

        const vehicleIdP = document.createElement('p');
        vehicleIdP.className = 'vehicle-id-display';
        vehicleIdP.textContent = `Vehicle Id : ${vehicle.vehicleId}`;
        vehicleInnerDivA.append(vehicleIdP);

        const vehicleNumberP = document.createElement('p');
        vehicleNumberP.className = 'vehicle-number-display';
        vehicleNumberP.textContent = `Vehicle Number : ${vehicle.vehicleNumber}`;
        vehicleInnerDivA.append(vehicleNumberP);

        const operatorIdP = document.createElement('p');
        operatorIdP.className = 'operator-id-display';
        operatorIdP.textContent = `Operator Id : ${vehicle.operatorId}`;
        vehicleInnerDivA.append(operatorIdP);

        const vehicleInnerDivB = document.createElement('div');
        vehicleInnerDivB.className = 'vehicle-inner-div-b';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.setAttribute('data-vehicle-id', vehicle.vehicleId);
        viewBtn.setAttribute('data-operator-id', vehicle.operatorId);
        // carry driverId forward for Entry shipping flow
        if (userAction === 'Entry shipping' && driverId) {
            viewBtn.setAttribute('data-driver-id', driverId);
        }
        viewBtn.textContent = 'View';

        viewBtn.addEventListener('click', function () {
            const vehicleId = this.getAttribute('data-vehicle-id');
            const operatorId = this.getAttribute('data-operator-id');

            if (userAction === 'Entry shipping') {
                const driverId = this.getAttribute('data-driver-id');
                window.location.href = `../../views/vehicle/vehicle.html?vehicleId=${vehicleId}&userAction=${userAction}&operatorId=${operatorId}&driverId=${driverId}`;
            } else if (userAction === 'Reassign vehicle') {
                const shippingId = params.get("shippingId");
                const operatorId = params.get("operatorId");
                const driverId = params.get('driverId');
                window.location.href = `../../views/vehicle/vehicle.html?vehicleId=${vehicleId}&userAction=${userAction}&shippingId=${shippingId}&operatorId=${operatorId}&driverId=${driverId}`;
            } else {
                // Read operator
                window.location.href = `../../views/vehicle/vehicle.html?vehicleId=${vehicleId}&userAction=${userAction}&operatorId=${operatorId}`;
            }
        }, { once: true });
        vehicleInnerDivB.append(viewBtn);

        vehicleDiv.append(vehicleInnerDivA);
        vehicleDiv.append(vehicleInnerDivB);
        listContainer.append(vehicleDiv);
    });
}

function dynamicLayoutRender(roleArray){
    const vehicleHeaderSectionDivB = document.querySelector('.vehicle-header-section-b');
    if(roleArray.length > 0 && !roleArray.includes("ADMIN") && vehicleHeaderSectionDivB){
        vehicleHeaderSectionDivB.remove();
    }
}

function clickEventBinder() {
    const userAction = params.get("userAction");
    const operatorId = params.get("operatorId");

    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function () {
            window.location.href = "/views/dashboard.html";
        }, { once: true });
    }

    const createVehicleBtn = document.getElementById('create-vehicle-btn');
    if (createVehicleBtn) {
        createVehicleBtn.addEventListener('click', function () {
            window.location.href = `../../views/vehicle/vehicle-creation-form.html?userAction=${userAction}&operatorId=${operatorId}`;
        }, { once: true });
    }

    const previousPageBtn = document.getElementById('previous-page-btn');
    if (previousPageBtn) {
        previousPageBtn.addEventListener('click', async function () {
            if (currentPageNo > 1) {
                currentPageNo--;
                await fetchVehicleList(operatorId, currentPageNo);
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page-btn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async function () {
            if (currentPageNo < totalPages) {
                currentPageNo++;
                await fetchVehicleList(operatorId, currentPageNo);
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
            const searchValue = searchInput.value.trim().toLowerCase();
            const vehicleItems = document.querySelectorAll('.vehicle-list-item');
            let hasMatch = false;

            vehicleItems.forEach(item => {
                const vehicleNumber = item.getAttribute('data-vehicle-number').toLowerCase();
                if (vehicleNumber.includes(searchValue) || searchValue === '') {
                    item.style.display = '';
                    hasMatch = true;
                } else {
                    item.style.display = 'none';
                }
            });

            if (!hasMatch && searchValue !== '') {
                const response = await ajaxCall(`/logistic/vehicle/fetchByNumber?vehicleNumber=${searchValue}`, 'GET', null);
                if (response) {
                    let vehicleList = [];

                    if (response && response.data) {
                        vehicleList = [response.data];
                    }

                    if (vehicleList.length > 0) {
                        renderVehicleList(vehicleList);
                    }
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchValue = this.value.trim();

            if (!searchValue) {
                const vehicleItems = document.querySelectorAll('.vehicle-list-item');
                vehicleItems.forEach(item => {
                    item.style.display = '';
                });
            }
        });
    }
}
searchClickEvent();

function vehicleNavigationBinder() {
    const vehicleNavigationBtn = document.getElementById('vehicle-navigation-btn');

    if (vehicleNavigationBtn) {
        vehicleNavigationBtn.addEventListener('click', function () {
            toggleVehicleNavigationMenu();
        });
    }
}

vehicleNavigationBinder();

function toggleVehicleNavigationMenu() {
    const vehicleNavigationMenu = document.getElementById('vehicle-navigation-menu');

    if (!vehicleNavigationMenu) {
        return;
    }

    vehicleNavigationMenu.classList.toggle('active');
}