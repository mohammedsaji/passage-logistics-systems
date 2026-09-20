const params = new URLSearchParams(window.location.search);
let currentPageNo = 1;
let totalPages = 1;
let currentResponse = null;

async function payloadExtractor() {
    const userAction = params.get("userAction");
    const transportType = params.get("transportType");

    if (!userAction || !transportType) {
        alert('Invalid parameters.');
        return;
    }

    // Remove create-operator-btn if not in Read operator flow
    if (userAction !== 'Read operator') {
        const createOperatorBtn = document.getElementById('create-operator-btn');
        if (createOperatorBtn) {
            createOperatorBtn.remove();
        }
    }

    currentPageNo = 1;
    await fetchOperatorList(transportType, currentPageNo);
}
payloadExtractor();

async function fetchOperatorList(transportType, pageNo) {
    const url = `/logistic/operator/fetchall?operatorTransportType=${transportType}&pageNo=${pageNo}`;
    const methodType = 'GET';
    const response = await ajaxCall(url, methodType, null);

    currentResponse = response;

    if (response && response.data) {
        const loginUserMap = await ajaxCall(`/logistic/account/user-info`, 'GET', null);
        const roleArray = loginUserMap?.data?.RoleList;
        if(roleArray && roleArray.length > 0) {
            dynamicLayoutRender(roleArray);
            const operatorList = Array.isArray(response.data.operatorList) ? response.data.operatorList : [response.data.operatorList];
            totalPages = response.data.totalPages;
            renderOperatorList(operatorList);
        }
    }
}

function renderOperatorList(operatorList) {

    const userAction = params.get("userAction");

    const listContainer = document.getElementById('operator-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }

    operatorList.forEach(operator => {
        if (!operator) return;

        const operatorDiv = document.createElement('div');
        operatorDiv.className = 'operator-list-item';
        operatorDiv.setAttribute('data-operator-id', operator.operatorId);
        operatorDiv.setAttribute('data-operator-name', operator.operatorName);

        const operatorInnerDivA = document.createElement('div');
        operatorInnerDivA.className = 'operator-inner-div-a';

        const operatorIdP = document.createElement('p');
        operatorIdP.className = 'operator-id-display';
        operatorIdP.textContent = `Operator Id : ${operator.operatorId}`;
        operatorInnerDivA.append(operatorIdP);

        const operatorNameP = document.createElement('p');
        operatorNameP.className = 'operator-name-display';
        operatorNameP.textContent = `Name : ${operator.operatorName}`;
        operatorInnerDivA.append(operatorNameP);

        const operatorTransportTypeP = document.createElement('p');
        operatorTransportTypeP.className = 'operator-transport-type-display';
        operatorTransportTypeP.textContent = `Transport Type : ${operator.operatorTransportType}`;
        operatorInnerDivA.append(operatorTransportTypeP);

        const operatorInnerDivB = document.createElement('div');
        operatorInnerDivB.className = 'operator-inner-div-b';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.setAttribute('data-operator-id', operator.operatorId);
        viewBtn.textContent = 'View';

        viewBtn.addEventListener('click', function () {
            const operatorId = this.getAttribute('data-operator-id');

            if (userAction === 'Reassign operator') {
                const shippingId = params.get("shippingId");
                window.location.href = `../../views/operator/operator.html?operatorId=${operatorId}&userAction=${userAction}&shippingId=${shippingId}`;
            } else {
                // Read operator, Entry shipping
                const accountUserName = params.get("accountUserName");
                window.location.href = `../../views/operator/operator.html?operatorId=${operatorId}&userAction=${userAction}&accountUserName=${accountUserName}`;
            }
        }, { once: true });
        operatorInnerDivB.append(viewBtn);

        operatorDiv.append(operatorInnerDivA);
        operatorDiv.append(operatorInnerDivB);
        listContainer.append(operatorDiv);
    });
}

function dynamicLayoutRender(roleArray){

    const userAction = params.get("userAction");


    const createOperatorBtn = document.getElementById('create-operator-btn');
    if(roleArray.length > 0 && !roleArray.includes("ADMIN")){
        createOperatorBtn.remove();
    }

    if(userAction === 'Entry shipping'){
        const operatorHeaderSectionDivB = document.querySelector('.operator-header-section-b');
        if(operatorHeaderSectionDivB){
            operatorHeaderSectionDivB.remove();
        }
    }
}

function clickEventBinder() {
    const userAction = params.get("userAction");
    const transportType = params.get("transportType");

    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function () {
            window.location.href = "/views/dashboard.html";
        }, { once: true });
    }

    const createOperatorBtn = document.getElementById('create-operator-btn');
    if (createOperatorBtn) {
        createOperatorBtn.addEventListener('click', function () {
            window.location.href = `../../views/operator/operator-creation-form.html?userAction=Entry operator`;
        }, { once: true });
    }

    const previousPageBtn = document.getElementById('previous-page-btn');
    if (previousPageBtn) {
        previousPageBtn.addEventListener('click', async function () {
            if (currentPageNo > 1) {
                currentPageNo--;
                await fetchOperatorList(transportType, currentPageNo);
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page-btn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async function () {
            if (currentPageNo < totalPages) {
                currentPageNo++;
                await fetchOperatorList(transportType, currentPageNo);
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
            const operatorItems = document.querySelectorAll('.operator-list-item');
            let hasMatch = false;

            operatorItems.forEach(item => {
                const operatorName = item.getAttribute('data-operator-name').toLowerCase();
                if (operatorName.includes(searchValue) || searchValue === '') {
                    item.style.display = '';
                    hasMatch = true;
                } else {
                    item.style.display = 'none';
                }
            });

            if (!hasMatch && searchValue !== '') {
                const response = await ajaxCall(`/logistic/operator/fetchByName?operatorName=${searchValue}`, 'GET', null);
                if (response) {
                    let operatorList = [];

                    if (response && response.data) {
                        operatorList = [response.data];
                    }

                    if (operatorList.length > 0) {
                        renderOperatorList(operatorList);
                    }
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchValue = this.value.trim();

            if (!searchValue) {
                const operatorItems = document.querySelectorAll('.operator-list-item');
                operatorItems.forEach(item => {
                    item.style.display = '';
                });
            }
        });
    }
}
searchClickEvent();

function operatorNavigationBinder() {

    const operatorNavigationBtn = document.getElementById('operator-navigation-btn');

    if (operatorNavigationBtn) {
        operatorNavigationBtn.addEventListener('click', function () {
            toggleOperatorNavigationMenu();
        });
    }
}

operatorNavigationBinder();

function toggleOperatorNavigationMenu() {

    const operatorNavigationMenu = document.getElementById('operator-navigation-menu');

    if (!operatorNavigationMenu) {
        return;
    }

    operatorNavigationMenu.classList.toggle('active');
}