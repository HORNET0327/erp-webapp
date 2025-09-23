# ERP 웹 애플리케이션

센서/케이블 유통업체용 ERP 시스템 (P&F, WAGO, MURR)

## 주요 기능

- **사용자 관리**: 역할 기반 권한 관리 (ADMIN, LEAD USER, USER)
- **재고 관리**: 제품, 브랜드, 카테고리, 재고 트랜잭션 관리
- **거래처 관리**: 고객, 공급업체 정보 관리
- **주문 관리**: 판매 주문, 구매 주문 관리
- **견적서 관리**: 견적서 생성, 인쇄, PDF 다운로드
- **이메일 발송**: 견적서, 주문서, 알림 이메일 발송
- **보고서**: 다양한 보고서 생성

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQL Server (Prisma ORM)
- **Email**: Nodemailer

## 환경 설정

### 1. 데이터베이스 설정

```bash
# .env 파일에 데이터베이스 연결 문자열 추가
DATABASE_URL="your_database_connection_string"
```

### 2. 이메일 설정 (선택사항)

```bash
# .env 파일에 이메일 설정 추가
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM_NAME="ERP 시스템"
```

### 3. 데이터베이스 마이그레이션

```bash
npm run prisma:migrate
npm run prisma:generate
npm run seed
```

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
