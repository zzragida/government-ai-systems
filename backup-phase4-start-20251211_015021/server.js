const express = require('express');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors({
    origin: '*', // 개발 중에는 모든 도메인 허용, 프로덕션에서는 특정 도메인만
    credentials: true
}));

app.use(express.json());

// DynamoDB 클라이언트 설정
const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

console.log('DynamoDB 설정:');
console.log('- 리전:', process.env.AWS_REGION);
console.log('- 테이블:', TABLE_NAME);

// 헬스 체크
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Jeju PDV API Server' });
});

// 1. PDV ID로 조회
app.get('/api/pdv/:pdvId', async (req, res) => {
    try {
        const { pdvId } = req.params;
        
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: { pdvId }
        });
        
        const result = await docClient.send(command);
        
        if (!result.Item) {
            return res.status(404).json({ error: 'PDV를 찾을 수 없습니다' });
        }
        
        res.json(result.Item);
    } catch (error) {
        console.error('PDV 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. 전화번호로 조회
app.get('/api/pdv/phone/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        
        // Scan으로 전화번호 검색 (전화번호에 인덱스가 없으므로)
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'phoneNumber = :phone',
            ExpressionAttributeValues: {
                ':phone': phoneNumber
            }
        });
        
        const result = await docClient.send(command);
        
        if (!result.Items || result.Items.length === 0) {
            return res.status(404).json({ error: 'PDV를 찾을 수 없습니다' });
        }
        
        res.json(result.Items[0]);
    } catch (error) {
        console.error('전화번호 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. 모든 PDV 조회 (관리자용)
app.get('/api/pdv', async (req, res) => {
    try {
        const command = new ScanCommand({
            TableName: TABLE_NAME
        });
        
        const result = await docClient.send(command);
        
        res.json({
            count: result.Count,
            items: result.Items
        });
    } catch (error) {
        console.error('PDV 목록 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. PDV 생성/업데이트
app.post('/api/pdv', async (req, res) => {
    try {
        const pdvData = req.body;
        
        // 필수 필드 검증
        if (!pdvData.pdvId || !pdvData.phoneNumber) {
            return res.status(400).json({ error: 'pdvId와 phoneNumber는 필수입니다' });
        }
        
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: pdvData
        });
        
        await docClient.send(command);
        
        res.json({ 
            success: true, 
            message: 'PDV 저장 완료',
            pdvId: pdvData.pdvId
        });
    } catch (error) {
        console.error('PDV 저장 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. PDV 업데이트
app.put('/api/pdv/:pdvId', async (req, res) => {
    try {
        const { pdvId } = req.params;
        const pdvData = req.body;
        
        // pdvId 유지
        pdvData.pdvId = pdvId;
        
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: pdvData
        });
        
        await docClient.send(command);
        
        res.json({ 
            success: true, 
            message: 'PDV 업데이트 완료',
            pdvId
        });
    } catch (error) {
        console.error('PDV 업데이트 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. PDV 삭제
app.delete('/api/pdv/:pdvId', async (req, res) => {
    try {
        const { pdvId } = req.params;
        
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pdvId }
        });
        
        await docClient.send(command);
        
        res.json({ 
            success: true, 
            message: 'PDV 삭제 완료',
            pdvId
        });
    } catch (error) {
        console.error('PDV 삭제 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Jeju PDV API Server 시작`);
    console.log(`포트: ${PORT}`);
    console.log(`환경: ${process.env.NODE_ENV}`);
    console.log(`\n사용 가능한 엔드포인트:`);
    console.log(`  GET    /health`);
    console.log(`  GET    /api/pdv/:pdvId`);
    console.log(`  GET    /api/pdv/phone/:phoneNumber`);
    console.log(`  GET    /api/pdv`);
    console.log(`  POST   /api/pdv`);
    console.log(`  PUT    /api/pdv/:pdvId`);
    console.log(`  DELETE /api/pdv/:pdvId`);
    console.log(`\n서버 주소: http://localhost:${PORT}`);
});
