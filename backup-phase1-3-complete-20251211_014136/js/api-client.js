// API 클라이언트 - DynamoDB 백엔드 연동

class APIClient {
    constructor() {
        this.baseURL = 'http://100.30.14.224:3001/api';
        console.log('APIClient 초기화:', this.baseURL);
    }

    // PDV ID로 조회
    async getPDVById(pdvId) {
        try {
            const response = await fetch(`${this.baseURL}/pdv/${pdvId}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('getPDVById 오류:', error);
            return null;
        }
    }

    // 전화번호로 조회
    async getPDVByPhone(phoneNumber) {
        try {
            const response = await fetch(`${this.baseURL}/pdv/phone/${encodeURIComponent(phoneNumber)}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('getPDVByPhone 오류:', error);
            return null;
        }
    }

    // 모든 PDV 조회
    async getAllPDVs() {
        try {
            const response = await fetch(`${this.baseURL}/pdv`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('getAllPDVs 오류:', error);
            return [];
        }
    }

    // PDV 저장/업데이트
    async savePDV(pdv) {
        try {
            const response = await fetch(`${this.baseURL}/pdv`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pdv)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('PDV 저장 완료:', result);
            return pdv;
        } catch (error) {
            console.error('savePDV 오류:', error);
            throw error;
        }
    }

    // PDV 업데이트
    async updatePDV(pdv) {
        try {
            const response = await fetch(`${this.baseURL}/pdv/${pdv.pdvId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pdv)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('PDV 업데이트 완료:', result);
            return pdv;
        } catch (error) {
            console.error('updatePDV 오류:', error);
            throw error;
        }
    }

    // PDV 삭제
    async deletePDV(pdvId) {
        try {
            const response = await fetch(`${this.baseURL}/pdv/${pdvId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('PDV 삭제 완료:', result);
            return true;
        } catch (error) {
            console.error('deletePDV 오류:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
console.log('APIClient 초기화');
window.apiClient = new APIClient();
