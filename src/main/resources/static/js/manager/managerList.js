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
    await fetchManagerList(operatorId, currentPageNo);
}
payloadExtractor();

async function fetchManagerList(operatorId, pageNo) {
    const url = `/logistic/manager/fetchall?operatorId=${operatorId}&pageNo=${pageNo}`;
    const methodType = 'GET';
    const response = await ajaxCall(url, methodType, null);

    currentResponse = response;

    if (response && response.data) {
        const loginUserMap = await ajaxCall(`/logistic/account/user-info`, 'GET', null);
        const roleArray = loginUserMap?.data?.RoleList;
        if(roleArray && roleArray.length > 0) {
            dynamicLayoutRender(roleArray);
            const managerList = Array.isArray(response.data.managerList) ? response.data.managerList : [response.data.managerList];
            totalPages = response.data.totalPages;
            renderManagerList(managerList);
        }
    }
}

function renderManagerList(managerList) {
    const userAction = params.get("userAction");

    const listContainer = document.getElementById('manager-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }

    managerList.forEach(manager => {
        if (!manager) return;

        const managerDiv = document.createElement('div');
        managerDiv.className = 'manager-list-item';
        managerDiv.setAttribute('data-manager-id', manager.managerId);
        managerDiv.setAttribute('data-manager-name', manager.managerName);

        const managerInnerDivA = document.createElement('div');
        managerInnerDivA.className = 'manager-inner-div-a';

        const managerIdP = document.createElement('p');
        managerIdP.className = 'manager-id-display';
        managerIdP.textContent = `Manager Id : ${manager.managerId}`;
        managerInnerDivA.append(managerIdP);

        const managerNameP = document.createElement('p');
        managerNameP.className = 'manager-name-display';
        managerNameP.textContent = `Name : ${manager.managerName}`;
        managerInnerDivA.append(managerNameP);

        const managerStatusP = document.createElement('p');
        managerStatusP.className = 'manager-status-display';
        managerStatusP.textContent = `Status : ${manager.managerStatus}`;
        managerInnerDivA.append(managerStatusP);

        const managerInnerDivB = document.createElement('div');
        managerInnerDivB.className = 'manager-inner-div-b';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.setAttribute('data-manager-id', manager.managerId);
        viewBtn.setAttribute('data-operator-id', manager.operatorId);
        viewBtn.textContent = 'View';

        viewBtn.addEventListener('click', function () {
            const managerId = this.getAttribute('data-manager-id');
            const operatorId = this.getAttribute('data-operator-id');
            window.location.href = `../../views/manager/manager.html?managerId=${managerId}&userAction=${userAction}&operatorId=${operatorId}`;
        }, {once: true});

        managerInnerDivB.append(viewBtn);

        managerDiv.append(managerInnerDivA);
        managerDiv.append(managerInnerDivB);
        listContainer.append(managerDiv);
    });
}

function dynamicLayoutRender(roleArray){
    const managerHeaderSectionDivB = document.querySelector('.manager-header-section-b');
    if(roleArray.length > 0 && !roleArray.includes("ADMIN") && managerHeaderSectionDivB){
        managerHeaderSectionDivB.remove();
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

    const createManagerBtn = document.getElementById('create-manager-btn');
    if (createManagerBtn) {
        createManagerBtn.addEventListener('click', function () {
            const userAction = 'Entry federate';
            const specificAction = 'Entry Manager';
            window.location.href = `../../views/signUp/sign-up.html?userAction=${userAction}&operatorId=${operatorId}&specificAction=${specificAction}`;
        }, {once: true});
    }

    const viewBtnArray = document.querySelectorAll('.view-btn');
    viewBtnArray.forEach(btn => {
        btn.addEventListener('click', function () {
            const managerId = this.getAttribute('data-manager-id');
            const operatorId = this.getAttribute('data-operator-id');
            window.location.href = `../../views/manager/manager.html?managerId=${managerId}&userAction=${userAction}&operatorId=${operatorId}`;
        }, {once: true});
    });

    const previousPageBtn = document.getElementById('previous-page-btn');
    if (previousPageBtn) {
        previousPageBtn.addEventListener('click', async function () {
            if (currentPageNo > 1) {
                currentPageNo--;
                await fetchManagerList(operatorId, currentPageNo);
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page-btn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async function () {
            if (currentPageNo < totalPages) {
                currentPageNo++;
                await fetchManagerList(operatorId, currentPageNo);
            }
        } );
    }
}
clickEventBinder();

function searchClickEvent() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search');

    if (searchBtn) {
        searchBtn.addEventListener('click', async function () {
            const searchValue = searchInput.value.trim().toLowerCase();
            const managerItems = document.querySelectorAll('.manager-list-item');
            let hasMatch = false;

            managerItems.forEach(item => {
                const managerName = item.getAttribute('data-manager-name').toLowerCase();
                if (managerName.includes(searchValue) || searchValue === '') {
                    item.style.display = '';
                    hasMatch = true;
                } else {
                    item.style.display = 'none';
                }
            });

            if (!hasMatch && searchValue !== '') {
                const response = await ajaxCall(`/logistic/manager/fetchByName?managerName=${searchValue}`, 'GET', null);
                if (response) {
                    let managerList = [];

                    if (response && response.data) {
                        managerList = [response.data];
                    }

                    if (managerList.length > 0) {
                        renderManagerList(managerList);
                    }
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchValue = this.value.trim().toLowerCase();

            if (!searchValue) {
                const managerItems = document.querySelectorAll('.manager-list-item');
                managerItems.forEach(item => {
                    item.style.display = '';
                });
            }
        });
    }
}
searchClickEvent();

function managerNavigationBinder() {
    const managerNavigationBtn = document.getElementById('manager-navigation-btn');

    if (managerNavigationBtn) {
        managerNavigationBtn.addEventListener('click', function () {
            toggleManagerNavigationMenu();
        });
    }
}

managerNavigationBinder();

function toggleManagerNavigationMenu() {
    const managerNavigationMenu = document.getElementById('manager-navigation-menu');

    if (!managerNavigationMenu) {
        return;
    }

    managerNavigationMenu.classList.toggle('active');
}