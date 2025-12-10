// My Page 관리

let currentDocumentName = null; // 현재 선택된 서류

function loadMyPageData() {
    console.log('My Page 데이터 로드 시작');
    
    if (!window.authManager || !window.authManager.getCurrentUser()) {
        console.error('로그인되지 않음');
        return;
    }
    
    const user = window.authManager.getCurrentUser();
    console.log('현재 사용자:', user);
    
    // 필요 서류 표시 (PDV 정보 표시 제거)
    displayRequiredDocuments(user);
    
    // 활동 타임라인 표시
    displayActivities(user);
}

function displayRequiredDocuments(user) {
    const container = document.getElementById('required-docs-container');
    if (!container) {
        console.error('required-docs-container를 찾을 수 없음');
        return;
    }
    
    let documents = [];
    
    if (user.type === 'citizen') {
        documents = [
            '주민등록등본',
            '주민등록초본',
            '인감증명서',
            '본인서명사실확인서',
            '가족관계증명서',
            '건강보험자격득실확인서',
            '소득금액증명원',
            '재산세납세증명서'
        ];
    } else if (user.type === 'organization') {
        const orgType = user.orgData?.type || '';
        
        // 단체 종류별 필요 서류
        if (window.organizationTypes && window.organizationTypes[orgType]) {
            documents = window.organizationTypes[orgType].requiredDocuments || [];
        } else {
            // 기본 서류
            documents = [
                '법인등기부등본',
                '사업자등록증',
                '정관',
                '법인인감증명서',
                '재무제표',
                '임대차계약서'
            ];
        }
    }
    
    // 사용자가 보유한 서류 추가
    const userDocNames = user.documents ? user.documents.map(d => d.name) : [];
    
    // 중복 제거
    const allDocs = [...new Set([...documents, ...userDocNames])];
    
    let html = `<div style="margin-bottom: 20px;">
        <button onclick="showAddDocumentModal()" style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)';
            this.style.boxShadow='0 4px 12px rgba(102,126,234,0.4)'" 
            onmouseout="this.style.transform='translateY(0)';
            this.style.boxShadow='none'">
            ➕ 서류 추가
        </button>
    </div>
    <div class="docs-grid">`;
    
    allDocs.forEach(doc => {
        const hasDoc = userDocNames.includes(doc);
        html += `
            <button class="doc-card ${hasDoc ? 'has-doc' : 'no-doc'}" 
                    onclick="showDocumentActions('${doc}', ${hasDoc})">
                <span class="doc-icon">${hasDoc ? '✅' : '📄'}</span>
                <span class="doc-name">${doc}</span>
                ${hasDoc ? '<span class="doc-status">보유</span>' : '<span class="doc-status">미보유</span>'}
            </button>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
    console.log('필요 서류 표시 완료');
}

function displayActivities(user) {
    const container = document.getElementById('activities-list');
    if (!container) {
        console.error('activities-list를 찾을 수 없음');
        return;
    }
    
    const activities = user.activities || [];
    
    if (activities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">아직 활동 내역이 없습니다.</p>';
        return;
    }
    
    let html = '';
    activities.forEach((activity, index) => {
        const date = new Date(activity.timestamp).toLocaleString('ko-KR');
        html += `
            <div class="activity-item">
                <div class="activity-number">#${activity.serialNumber || index + 1}</div>
                <div class="activity-content">
                    <div class="activity-type">${activity.type || '활동'}</div>
                    <div class="activity-desc">${activity.description || ''}</div>
                    <div class="activity-time">${date}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // OpenHash 생성 버튼 표시 여부
    const createHashBtn = document.getElementById('create-hash-btn-container');
    if (createHashBtn) {
        if (activities.length >= 5) {
            createHashBtn.innerHTML = '<button onclick="createOpenHashGroups()" style="padding: 12px 24px; background: #2e7d32; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 20px;">🔗 OpenHash 생성</button>';
        } else {
            createHashBtn.innerHTML = '';
        }
    }
    
    console.log('활동 타임라인 표시 완료');
}

// My Page 탭이 열릴 때 자동 로드
function showMyPage() {
    console.log('showMyPage 호출됨');
    switchTab('mypage');
    
    // 잠시 후 데이터 로드 (DOM이 준비될 시간 확보)
    setTimeout(() => {
        loadMyPageData();
    }, 100);
}

// ===== 서류 추가 기능 =====
function showAddDocumentModal() {
    const modal = document.getElementById('add-document-modal');
    if (modal) {
        modal.style.display = 'flex';
        populateDocumentDatalist();
    }
}

function closeAddDocumentModal() {
    const modal = document.getElementById('add-document-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('document-name-input').value = '';
    }
}

function populateDocumentDatalist() {
    const datalist = document.getElementById('document-list');
    if (!datalist) {
        console.error('document-list datalist를 찾을 수 없음');
        return;
    }
    
    const user = window.authManager?.getCurrentUser();
    if (!user) {
        console.error('현재 사용자 정보 없음');
        return;
    }
    
    datalist.innerHTML = '';
    
    let availableDocuments = [];
    
    if (user.type === 'citizen') {
        if (window.citizenDocuments) {
            availableDocuments = Object.keys(window.citizenDocuments).sort();
        }
    } else if (user.type === 'organization') {
        const orgType = user.orgData?.type || '';
        
        if (window.organizationTypes && window.organizationTypes[orgType]) {
            const orgTypeData = window.organizationTypes[orgType];
            availableDocuments = orgTypeData.requiredDocuments || [];
        } else {
            availableDocuments = [
                '법인등기부등본',
                '사업자등록증',
                '정관',
                '법인인감증명서',
                '재무제표',
                '손익계산서',
                '재무상태표',
                '임대차계약서',
                '사업자등록증명원',
                '법인세신고서'
            ];
        }
        
        availableDocuments.sort();
    }
    
    console.log(`드롭다운에 표시할 서류 수: ${availableDocuments.length}`);
    
    availableDocuments.forEach(docName => {
        const option = document.createElement('option');
        option.value = docName;
        
        if (user.type === 'citizen' && window.citizenDocuments && window.citizenDocuments[docName]) {
            const doc = window.citizenDocuments[docName];
            option.textContent = `${docName} (${doc.category})`;
        } else {
            option.textContent = docName;
        }
        
        datalist.appendChild(option);
    });
}

function addDocumentToPDV() {
    if (!window.authManager || !window.authManager.getCurrentUser()) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const docNameInput = document.getElementById('document-name-input');
    const docName = docNameInput.value.trim();
    
    if (!docName) {
        alert('서류 이름을 입력해주세요.');
        return;
    }
    
    const user = window.authManager.getCurrentUser();
    
    if (user.documents && user.documents.some(d => d.name === docName)) {
        alert('이미 보유한 서류입니다.');
        return;
    }
    
    if (!user.documents) {
        user.documents = [];
    }
    
    const newDocument = {
        name: docName,
        addedAt: new Date().toISOString(),
        status: '보유'
    };
    
    if (window.citizenDocuments && window.citizenDocuments[docName]) {
        const docInfo = window.citizenDocuments[docName];
        newDocument.category = docInfo.category;
        newDocument.description = docInfo.description;
        newDocument.issuer = docInfo.issuer;
    }
    
    user.documents.push(newDocument);
    
    if (window.pdvManager) {
        window.pdvManager.updatePDV(user);
        window.authManager.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    closeAddDocumentModal();
    loadMyPageData();
    
    alert(`"${docName}" 서류가 추가되었습니다.`);
}

// ===== 서류 액션 메뉴 =====
function showDocumentActions(docName, hasDoc) {
    if (!hasDoc) {
        alert(`"${docName}" 서류를 먼저 추가해주세요.`);
        return;
    }
    
    currentDocumentName = docName;
    
    const modal = document.getElementById('document-action-modal');
    const title = document.getElementById('action-modal-title');
    
    if (modal && title) {
        title.textContent = `📄 ${docName}`;
        modal.style.display = 'flex';
    }
}

function closeDocumentActionModal() {
    const modal = document.getElementById('document-action-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentDocumentName = null;
}

function handleDocumentView() {
    if (!currentDocumentName) return;
    
    alert(`"${currentDocumentName}" 열람 기능은 준비 중입니다.`);
    closeDocumentActionModal();
}

function handleDocumentRenew() {
    if (!currentDocumentName) return;
    
    alert(`"${currentDocumentName}" 갱신 기능은 준비 중입니다.`);
    closeDocumentActionModal();
}

function handleDocumentDelete() {
    if (!currentDocumentName) return;
    
    if (!confirm(`"${currentDocumentName}" 서류를 삭제하시겠습니까?`)) {
        return;
    }
    
    const user = window.authManager.getCurrentUser();
    if (!user.documents) return;
    
    user.documents = user.documents.filter(d => d.name !== currentDocumentName);
    
    if (window.pdvManager) {
        window.pdvManager.updatePDV(user);
        window.authManager.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    closeDocumentActionModal();
    loadMyPageData();
    
    alert(`"${currentDocumentName}" 서류가 삭제되었습니다.`);
}

// ===== 수신자 선택 =====
function showRecipientSelector() {
    closeDocumentActionModal();
    
    const modal = document.getElementById('recipient-selector-modal');
    if (modal) {
        modal.style.display = 'flex';
        loadRecipientList();
        
        // 검색 입력 이벤트
        const searchInput = document.getElementById('recipient-search-input');
        if (searchInput) {
            searchInput.oninput = () => filterRecipients(searchInput.value);
        }
    }
}

function closeRecipientSelectorModal() {
    const modal = document.getElementById('recipient-selector-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('recipient-search-input').value = '';
    }
}

function loadRecipientList() {
    const container = document.getElementById('recipient-list');
    if (!container) return;
    
    // 모든 PDV 가져오기
    const allPDVs = window.pdvManager?.getAllPDVs() || [];
    const currentUser = window.authManager?.getCurrentUser();
    
    // 본인 제외
    const recipients = allPDVs.filter(pdv => pdv.pdvId !== currentUser?.pdvId);
    
    if (recipients.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">등록된 수신자가 없습니다.</p>';
        return;
    }
    
    displayRecipients(recipients);
}

function displayRecipients(recipients) {
    const container = document.getElementById('recipient-list');
    if (!container) return;
    
    let html = '';
    
    recipients.forEach(recipient => {
        let name = '';
        let type = '';
        
        if (recipient.type === 'citizen') {
            name = recipient.personData?.name || '이름 없음';
            type = '개인';
        } else {
            name = recipient.orgData?.name || '단체명 없음';
            type = recipient.orgData?.type || '단체';
        }
        
        html += `
            <div class="recipient-item" onclick="selectRecipient('${recipient.pdvId}', '${name}')">
                <div class="recipient-name">${name}</div>
                <div class="recipient-info">
                    ${type} | ${recipient.phoneNumber || '전화번호 없음'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterRecipients(searchTerm) {
    const allPDVs = window.pdvManager?.getAllPDVs() || [];
    const currentUser = window.authManager?.getCurrentUser();
    
    const recipients = allPDVs.filter(pdv => {
        if (pdv.pdvId === currentUser?.pdvId) return false;
        
        const term = searchTerm.toLowerCase();
        const name = pdv.type === 'citizen' 
            ? (pdv.personData?.name || '') 
            : (pdv.orgData?.name || '');
        const phone = pdv.phoneNumber || '';
        
        return name.toLowerCase().includes(term) || phone.includes(term);
    });
    
    displayRecipients(recipients);
}

function selectRecipient(recipientId, recipientName) {
    if (!currentDocumentName) return;
    
    if (confirm(`"${currentDocumentName}" 서류를 "${recipientName}"에게 전송하시겠습니까?`)) {
        sendDocument(recipientId, recipientName);
    }
}

function sendDocument(recipientId, recipientName) {
    const user = window.authManager?.getCurrentUser();
    if (!user) return;
    
    // 활동 기록 추가
    if (!user.activities) {
        user.activities = [];
    }
    
    const activity = {
        serialNumber: user.activities.length + 1,
        type: '서류 전송',
        description: `"${currentDocumentName}" 서류를 "${recipientName}"에게 전송`,
        timestamp: new Date().toISOString(),
        documentName: currentDocumentName,
        recipientId: recipientId,
        recipientName: recipientName
    };
    
    user.activities.push(activity);
    
    // PDV 업데이트
    if (window.pdvManager) {
        window.pdvManager.updatePDV(user);
        window.authManager.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    closeRecipientSelectorModal();
    loadMyPageData();
    
    alert(`✅ "${currentDocumentName}" 서류가 "${recipientName}"에게 전송되었습니다.`);
    currentDocumentName = null;
}

// OpenHash 생성
async function createOpenHashGroups() {
    const user = window.authManager?.getCurrentUser();
    if (!user || !user.activities) return;
    
    const activities = user.activities;
    
    if (activities.length < 5) {
        alert('OpenHash를 생성하려면 최소 5개의 활동이 필요합니다.');
        return;
    }
    
    try {
        const groups = await window.openHashManager.createHashGroups(activities);
        
        groups.forEach(group => {
            window.openHashManager.saveHashRecord(group, user.pdvId);
        });
        
        alert(`✅ ${groups.length}개의 OpenHash 그룹이 생성되었습니다!`);
        
        if (confirm('OpenHash 탭에서 확인하시겠습니까?')) {
            if (typeof switchTab === 'function') {
                switchTab('openhash');
            }
        }
    } catch (error) {
        console.error('OpenHash 생성 오류:', error);
        alert('OpenHash 생성 중 오류가 발생했습니다.');
    }
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('My Page 스크립트 로드됨');
    });
} else {
    console.log('My Page 스크립트 로드됨');
}
