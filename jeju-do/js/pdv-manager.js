// PDV 관리 시스템 - DynamoDB API 기반

class PDVManager {
    constructor() {
        this.storageKey = 'pdv_data'; // localStorage 폴백용
        this.useAPI = true; // API 사용 플래그
        console.log('PDVManager 초기화 (API 모드)');
    }

    // PDV ID 생성
    generatePDVId() {
        return 'PDV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // PDV 저장 (API 기반)
    async savePDV(pdv) {
        try {
            if (this.useAPI && window.apiClient) {
                // API로 저장
                const result = await window.apiClient.savePDV(pdv);
                console.log('PDV 저장 완료 (API):', pdv.pdvId);
                
                // localStorage에도 캐시 저장 (폴백용)
                this._saveToLocalStorage(pdv);
                
                return result;
            } else {
                // 폴백: localStorage 사용
                return this._saveToLocalStorage(pdv);
            }
        } catch (error) {
            console.error('PDV 저장 오류:', error);
            // API 실패 시 localStorage로 폴백
            return this._saveToLocalStorage(pdv);
        }
    }

    // localStorage에 저장 (폴백용)
    _saveToLocalStorage(pdv) {
        const allPDVs = this._getAllFromLocalStorage();
        const existingIndex = allPDVs.findIndex(p => p.phoneNumber === pdv.phoneNumber);
        
        if (existingIndex >= 0) {
            allPDVs[existingIndex] = pdv;
        } else {
            allPDVs.push(pdv);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(allPDVs));
        console.log('PDV 저장 완료 (localStorage):', pdv.pdvId);
        return pdv;
    }

    // localStorage에서 모두 가져오기
    _getAllFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('localStorage 로드 오류:', error);
            return [];
        }
    }

    // 전체 PDV 조회 (API 기반)
    async getAllPDVs() {
        try {
            if (this.useAPI && window.apiClient) {
                const items = await window.apiClient.getAllPDVs();
                console.log('PDV 목록 로드 (API):', items.length, '개');
                return items;
            } else {
                return this._getAllFromLocalStorage();
            }
        } catch (error) {
            console.error('PDV 로드 오류:', error);
            // API 실패 시 localStorage 사용
            return this._getAllFromLocalStorage();
        }
    }

    // PDV ID로 조회 (API 기반)
    async getPDVById(pdvId) {
        try {
            if (this.useAPI && window.apiClient) {
                const pdv = await window.apiClient.getPDVById(pdvId);
                return pdv;
            } else {
                const allPDVs = this._getAllFromLocalStorage();
                return allPDVs.find(pdv => pdv.pdvId === pdvId);
            }
        } catch (error) {
            console.error('PDV 조회 오류:', error);
            // 폴백
            const allPDVs = this._getAllFromLocalStorage();
            return allPDVs.find(pdv => pdv.pdvId === pdvId);
        }
    }

    // 전화번호로 조회 (API 기반)
    async getPDVByPhone(phoneNumber) {
        try {
            if (this.useAPI && window.apiClient) {
                const pdv = await window.apiClient.getPDVByPhone(phoneNumber);
                return pdv;
            } else {
                const allPDVs = this._getAllFromLocalStorage();
                return allPDVs.find(pdv => pdv.phoneNumber === phoneNumber);
            }
        } catch (error) {
            console.error('PDV 조회 오류:', error);
            // 폴백
            const allPDVs = this._getAllFromLocalStorage();
            return allPDVs.find(pdv => pdv.phoneNumber === phoneNumber);
        }
    }

    // PDV 업데이트 (API 기반)
    async updatePDV(pdv) {
        try {
            if (this.useAPI && window.apiClient) {
                const result = await window.apiClient.updatePDV(pdv);
                console.log('PDV 업데이트 완료 (API):', pdv.pdvId);
                
                // localStorage에도 캐시
                this._saveToLocalStorage(pdv);
                
                return result;
            } else {
                return this._saveToLocalStorage(pdv);
            }
        } catch (error) {
            console.error('PDV 업데이트 오류:', error);
            return this._saveToLocalStorage(pdv);
        }
    }

    // PDV 삭제 (API 기반)
    async deletePDV(pdvId) {
        try {
            if (this.useAPI && window.apiClient) {
                await window.apiClient.deletePDV(pdvId);
                console.log('PDV 삭제 (API):', pdvId);
                
                // localStorage에서도 삭제
                const allPDVs = this._getAllFromLocalStorage();
                const filtered = allPDVs.filter(pdv => pdv.pdvId !== pdvId);
                localStorage.setItem(this.storageKey, JSON.stringify(filtered));
            } else {
                // 폴백
                const allPDVs = this._getAllFromLocalStorage();
                const filtered = allPDVs.filter(pdv => pdv.pdvId !== pdvId);
                localStorage.setItem(this.storageKey, JSON.stringify(filtered));
                console.log('PDV 삭제 (localStorage):', pdvId);
            }
        } catch (error) {
            console.error('PDV 삭제 오류:', error);
        }
    }

    // 활동 추가
    async addActivity(pdvId, activity) {
        try {
            const pdv = await this.getPDVById(pdvId);
            if (!pdv) {
                console.error('PDV를 찾을 수 없음:', pdvId);
                return false;
            }

            if (!pdv.activities) {
                pdv.activities = [];
            }

            activity.timestamp = activity.timestamp || new Date().toISOString();
            pdv.activities.push(activity);

            await this.updatePDV(pdv);
            console.log('활동 추가:', activity.type);
            return true;
        } catch (error) {
            console.error('활동 추가 오류:', error);
            return false;
        }
    }

    // 문서 추가
    async addDocument(pdvId, document) {
        try {
            const pdv = await this.getPDVById(pdvId);
            if (!pdv) {
                console.error('PDV를 찾을 수 없음:', pdvId);
                return false;
            }

            if (!pdv.documents) {
                pdv.documents = [];
            }

            document.uploadedAt = document.uploadedAt || new Date().toISOString();
            pdv.documents.push(document);

            await this.updatePDV(pdv);
            console.log('문서 추가:', document.name);
            return true;
        } catch (error) {
            console.error('문서 추가 오류:', error);
            return false;
        }
    }

    // 전체 초기화 (개발용)
    clearAll() {
        localStorage.removeItem(this.storageKey);
        console.log('모든 PDV 데이터 삭제 (localStorage)');
        console.warn('API 데이터는 직접 삭제해야 합니다');
    }
}

// 전역 인스턴스 생성
console.log('PDVManager 초기화 (API 모드)');
window.pdvManager = new PDVManager();
