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
    await fetchDriverList(operatorId, currentPageNo);
}

payloadExtractor();

async function fetchDriverList(operatorId, pageNo) {
    const url = `/logistic/driver/fetchall?operatorId=${operatorId}&pageNo=${pageNo}`;
    const methodType = 'GET';
    const response = await ajaxCall(url, methodType, null);

    currentResponse = response;

    if (response && response.data) {
        const loginUserMap = await ajaxCall(`/logistic/account/user-info`, 'GET', null);
        const roleArray = loginUserMap?.data?.RoleList;
        if(roleArray && roleArray.length > 0){
            dynamicLayoutRender(roleArray);
            const driverList = Array.isArray(response.data.driverList) ? response.data.driverList : [response.data.driverList];
            totalPages = response.data.totalPages;
            renderDriverList(driverList);
        }
    }
}

function renderDriverList(driverList) {
    const userAction = params.get("userAction");

    const listContainer = document.getElementById('driver-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }

    driverList.forEach(driver => {
        if (!driver) return;

        const driverDiv = document.createElement('div');
        driverDiv.className = 'driver-list-item';
        driverDiv.setAttribute('data-driver-id', driver.driverId);
        driverDiv.setAttribute('data-driver-name', driver.driverName);

        const driverInnerDivA = document.createElement('div');
        driverInnerDivA.className = 'driver-inner-div-a';

        const driverIdP = document.createElement('p');
        driverIdP.className = 'driver-id-display';
        driverIdP.textContent = `Driver Id : ${driver.driverId}`;
        driverInnerDivA.append(driverIdP);

        const driverNameP = document.createElement('p');
        driverNameP.className = 'driver-name-display';
        driverNameP.textContent = `Driver Name : ${driver.driverName}`;
        driverInnerDivA.append(driverNameP);

        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.setAttribute('data-driver-id', driver.driverId);
        viewBtn.setAttribute('data-operator-id', driver.operatorId);
        viewBtn.textContent = 'View';

        const driverInnerDivB = document.createElement('div');
        driverInnerDivB.className = 'driver-inner-div-b';

        viewBtn.addEventListener('click', function () {
            const driverId = this.getAttribute('data-driver-id');
            const operatorId = this.getAttribute('data-operator-id');
            if (userAction === 'Reassign driver') {
                const shippingId = params.get("shippingId");
                window.location.href = `../../views/driver/driver.html?shippingId=${shippingId}&driverId=${driverId}&userAction=${userAction}&operatorId=${operatorId}`;
            } else {
                // Read operator
                window.location.href = `../../views/driver/driver.html?driverId=${driverId}&userAction=${userAction}&operatorId=${operatorId}`;
            }
        }, {once: true});

        driverInnerDivB.append(viewBtn);

        driverDiv.append(driverInnerDivA);
        driverDiv.append(driverInnerDivB);
        listContainer.append(driverDiv);
    });
}

function dynamicLayoutRender(roleArray){
    const driverHeaderSectionDivB = document.querySelector('.driver-header-section-b');
    if(roleArray.length > 0 && !roleArray.includes("ADMIN") && driverHeaderSectionDivB){
        driverHeaderSectionDivB.remove();
    }
}

function clickEventBinder() {
    const userAction = params.get("userAction");
    const operatorId = params.get("operatorId");

    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function () {
            window.location.href = "/views/dashboard.html";
        }, {once: true});
    }

    const createDriverBtn = document.getElementById('create-driver-btn');
    if (createDriverBtn) {
        createDriverBtn.addEventListener('click', function () {
            const userAction = 'Entry federate';
            const specificAction = 'Entry Driver';
            window.location.href = `../../views/signUp/sign-up.html?userAction=${userAction}&operatorId=${operatorId}&specificAction=${specificAction}`;
        }, {once: true});
    }

    const previousPageBtn = document.getElementById('previous-page-btn');
    if (previousPageBtn) {
        previousPageBtn.addEventListener('click', async function () {
            if (currentPageNo > 1) {
                currentPageNo--;
                await fetchDriverList(operatorId, currentPageNo);
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page-btn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async function () {
            if (currentPageNo < totalPages) {
                currentPageNo++;
                await fetchDriverList(operatorId, currentPageNo);
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
            const driverItems = document.querySelectorAll('.driver-list-item');
            let hasMatch = false;

            driverItems.forEach(item => {
                const driverName = item.getAttribute('data-driver-name').toLowerCase();
                if (driverName.includes(searchValue) || searchValue === '') {
                    item.style.display = '';
                    hasMatch = true;
                } else {
                    item.style.display = 'none';
                }
            });

            if (!hasMatch && searchValue !== '') {
                const response = await ajaxCall(`/logistic/driver/fetchByName?driverName=${searchValue}`, 'GET', null);
                if (response) {
                    let driverList = [];

                    if (response && response.data) {
                        driverList = [response.data];
                    }

                    if (driverList.length > 0) {
                        renderDriverList(driverList);
                    }
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchValue = this.value.trim().toLowerCase();

            if (!searchValue) {
                const driverItems = document.querySelectorAll('.driver-list-item');
                driverItems.forEach(item => {
                    item.style.display = '';
                });
            }
        });
    }
}

searchClickEvent();

function driverNavigationBinder() {
    const driverNavigationBtn = document.getElementById('driver-navigation-btn');

    if (driverNavigationBtn) {
        driverNavigationBtn.addEventListener('click', function () {
            toggleDriverNavigationMenu();
        });
    }
}

driverNavigationBinder();

function toggleDriverNavigationMenu() {
    const driverNavigationMenu = document.getElementById('driver-navigation-menu');

    if (!driverNavigationMenu) {
        return;
    }

    driverNavigationMenu.classList.toggle('active');
}