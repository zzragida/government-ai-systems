// 인증 관리 시스템

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // 페이지 로드 시 로그인 상태 확인
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateAuthUI();
        }
        
        // 로그인 폼 이벤트 리스너
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    async handleLogin() {
        const phoneNumber = document.getElementById('login-phone').value.trim();
        
        if (!phoneNumber) {
            alert('전화번호를 입력해주세요.');
            return;
        }
        
        // PDV 존재 여부 확인
        const pdv = this.findPDVByPhone(phoneNumber);
        
        if (pdv) {
            // 기존 PDV 로그인
            this.currentUser = pdv;
            localStorage.setItem('currentUser', JSON.stringify(pdv));
            this.updateAuthUI();
            closeLoginModal();
            
            alert(`환영합니다, ${this.getUserDisplayName()}님!`);
            
            // My Page로 이동
            if (typeof showMyPage === 'function') {
                showMyPage();
            }
        } else {
            // PDV 없음 - 생성 모달 표시
            closeLoginModal();
            showPDVCreateModal(phoneNumber);
        }
    }

    findPDVByPhone(phoneNumber) {
        // PDV Manager에서 검색
        if (window.pdvManager) {
            const allPDVs = window.pdvManager.getAllPDVs();
            return allPDVs.find(pdv => pdv.phoneNumber === phoneNumber);
        }
        return null;
    }

    async createPDV(pdvData) {
        if (!window.pdvManager) {
            alert('PDV Manager가 초기화되지 않았습니다.');
            return;
        }
        
        // PDV 생성
        const pdvId = window.pdvManager.generatePDVId();
        const newPDV = {
            pdvId: pdvId,
            phoneNumber: pdvData.phoneNumber,
            type: pdvData.type,
            createdAt: new Date().toISOString(),
            documents: [],
            activities: []
        };
        
        // 타입별 데이터 추가
        if (pdvData.type === 'citizen') {
            newPDV.personData = pdvData.personData;
        } else if (pdvData.type === 'organization') {
            newPDV.orgData = pdvData.orgData;
        }
        
        // 저장
        window.pdvManager.savePDV(newPDV);
        
        // 자동 로그인
        this.currentUser = newPDV;
        localStorage.setItem('currentUser', JSON.stringify(newPDV));
        this.updateAuthUI();
        
        // My Page로 이동
        if (typeof showMyPage === 'function') {
            showMyPage();
        }
    }

    getUserDisplayName() {
        if (!this.currentUser) return '';
        
        if (this.currentUser.type === 'citizen') {
            return this.currentUser.personData?.name || '도민';
        } else {
            return this.currentUser.orgData?.name || '단체';
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateAuthUI() {
        const loggedIn = document.getElementById('auth-logged-in');
        const loggedOut = document.getElementById('auth-logged-out');
        const mypageTab = document.getElementById('mypage-tab');
        
        if (this.currentUser) {
            if (loggedOut) loggedOut.style.display = 'none';
            if (loggedIn) {
                loggedIn.style.display = 'flex';
                const displayName = this.getUserDisplayName();
                const mypageBtn = loggedIn.querySelector('.mypage-btn');
                if (mypageBtn) {
                    mypageBtn.textContent = `${displayName} My Page`;
                }
            }
            if (mypageTab) mypageTab.style.display = 'inline-block';
        } else {
            if (loggedOut) loggedOut.style.display = 'flex';
            if (loggedIn) loggedIn.style.display = 'none';
            if (mypageTab) mypageTab.style.display = 'none';
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateAuthUI();
        
        // 메인 탭으로 이동
        if (typeof switchTab === 'function') {
            switchTab('dochung');
        }
        
        alert('로그아웃되었습니다.');
    }
}

// 전역 함수들
function openLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

// 전역 인스턴스 생성
window.authManager = new AuthManager();
