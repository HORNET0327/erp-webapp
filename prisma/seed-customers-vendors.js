const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("거래처 샘플 데이터 생성 시작...");

  try {
    // 고객 데이터 생성
    const customers = [
      {
        code: "CUST-001",
        name: "삼성전자",
        contactPerson: "김영수",
        email: "youngsu.kim@samsung.com",
        phone: "02-1234-5678",
        address: "서울특별시 수원시 영통구 삼성로 129",
        notes: "대형 고객사, 연간 계약, 특별 할인 적용",
        isActive: true,
      },
      {
        code: "CUST-002",
        name: "현대글로비스",
        contactPerson: "박민지",
        email: "minji.park@hyundaiglovis.com",
        phone: "02-2345-6789",
        address: "서울특별시 강남구 테헤란로 152",
        notes: "물류센터 운영, 정기 주문, 빠른 배송 요구",
        isActive: true,
      },
      {
        code: "CUST-003",
        name: "현대로템",
        contactPerson: "이철수",
        email: "chulsoo.lee@hyundai-rotem.com",
        phone: "02-3456-7890",
        address: "서울특별시 종로구 세종대로 209",
        notes: "철도차량 제조업체, 대량 주문, 품질 인증 필요",
        isActive: true,
      },
      {
        code: "CUST-004",
        name: "LG전자",
        contactPerson: "정수진",
        email: "sujin.jung@lge.com",
        phone: "02-4567-8901",
        address: "서울특별시 영등포구 여의대로 128",
        notes: "경쟁사, 가격 민감, 기술 지원 중요",
        isActive: true,
      },
      {
        code: "CUST-005",
        name: "SK하이닉스",
        contactPerson: "최동현",
        email: "donghyun.choi@skhynix.com",
        phone: "02-5678-9012",
        address: "경기도 이천시 신둔면 경충대로 2091",
        notes: "반도체 제조업체, 클린룸 환경, 고품질 요구",
        isActive: true,
      },
      {
        code: "CUST-006",
        name: "포스코",
        contactPerson: "김철강",
        email: "steel.kim@posco.com",
        phone: "02-3457-8901",
        address: "경기도 포항시 남구 대잠동 1",
        notes: "철강 제조업체, 대규모 프로젝트, 장기 계약 선호",
        isActive: true,
      },
      {
        code: "CUST-007",
        name: "한국전력공사",
        contactPerson: "이전력",
        email: "power.lee@kepco.co.kr",
        phone: "02-3456-7890",
        address: "전라남도 나주시 빛가람동 55",
        notes: "전력 공급업체, 안전 기준 엄격, 정부 계약",
        isActive: true,
      },
      {
        code: "CUST-008",
        name: "두산에너빌리티",
        contactPerson: "박에너지",
        email: "energy.park@doosan.com",
        phone: "02-4567-8901",
        address: "서울특별시 중구 을지로 281",
        notes: "에너지 솔루션 전문, 해외 진출 활발, 기술 혁신 중시",
        isActive: true,
      },
      {
        code: "CUST-009",
        name: "한화시스템",
        contactPerson: "정시스템",
        email: "system.jung@hanwha.com",
        phone: "02-5678-9012",
        address: "서울특별시 송파구 법원로 9길 26",
        notes: "방산 및 우주 시스템, 보안 요구사항 높음, 정밀 부품",
        isActive: true,
      },
      {
        code: "CUST-010",
        name: "한국가스공사",
        contactPerson: "최가스",
        email: "gas.choi@kogas.or.kr",
        phone: "02-6789-0123",
        address: "대전광역시 서구 둔산대로 124",
        notes: "가스 공급 인프라, 안전 관리 중요, 정기 점검 필수",
        isActive: true,
      },
    ];

    // 공급업체 데이터 생성
    const vendors = [
      {
        code: "VEND-001",
        name: "P&F 코리아",
        contactPerson: "김대표",
        email: "ceo@pf-korea.co.kr",
        phone: "02-1111-2222",
        address: "서울특별시 강남구 역삼동 123-45",
        notes: "P&F 센서 정식 대리점, 독점 공급, 기술 지원 제공",
        isActive: true,
      },
      {
        code: "VEND-002",
        name: "WAGO 코리아",
        contactPerson: "박영희",
        email: "younghee.park@wago.com",
        phone: "02-3333-4444",
        address: "서울특별시 서초구 서초대로 74길 11",
        notes: "WAGO 커넥터 전문, 빠른 납기, 품질 보증",
        isActive: true,
      },
      {
        code: "VEND-003",
        name: "MURR 코리아",
        contactPerson: "이성호",
        email: "sungho.lee@murr.com",
        phone: "02-5555-6666",
        address: "서울특별시 마포구 마포대로 92",
        notes: "MURR 센서 및 케이블 전문, 독일 기술, 고정밀도",
        isActive: true,
      },
      {
        code: "VEND-004",
        name: "한국전자부품연구원",
        contactPerson: "정연구",
        email: "research@keti.re.kr",
        phone: "02-7777-8888",
        address: "경기도 성남시 분당구 판교역로 166",
        notes: "연구기관, 특수 부품, 개발 지원, 기술 컨설팅",
        isActive: true,
      },
      {
        code: "VEND-005",
        name: "대한전자",
        contactPerson: "최사장",
        email: "president@daehan-electronics.co.kr",
        phone: "02-9999-0000",
        address: "서울특별시 구로구 디지털로 26길 5",
        notes: "국내 제조업체, 경쟁력 있는 가격, 빠른 대응",
        isActive: true,
      },
      {
        code: "VEND-006",
        name: "일본 센서테크",
        contactPerson: "야마다 타케시",
        email: "yamada@sensortech.jp",
        phone: "+81-3-1234-5678",
        address: "도쿄도 시부야구 센서로 123",
        notes: "일본 센서 전문업체, 고정밀 센서, 기술 지원 우수",
        isActive: true,
      },
      {
        code: "VEND-007",
        name: "독일 인더스트리얼",
        contactPerson: "Hans Mueller",
        email: "hans.mueller@industrial-de.com",
        phone: "+49-30-9876-5432",
        address: "Berlin, Germany Industrial Str. 456",
        notes: "독일 산업용 부품 전문, EU 인증, 고품질 보장",
        isActive: true,
      },
      {
        code: "VEND-008",
        name: "중국 전자부품",
        contactPerson: "왕리",
        email: "wang.li@china-electronics.cn",
        phone: "+86-21-8765-4321",
        address: "상하이시 푸동신구 전자로 789",
        notes: "중국 대형 제조업체, 대량 생산, 가격 경쟁력",
        isActive: true,
      },
      {
        code: "VEND-009",
        name: "미국 테크솔루션",
        contactPerson: "John Smith",
        email: "john.smith@techsolutions.us",
        phone: "+1-555-123-4567",
        address: "Silicon Valley, CA Tech Blvd 321",
        notes: "미국 첨단 기술, R&D 중심, 혁신 제품",
        isActive: true,
      },
      {
        code: "VEND-010",
        name: "한국 정밀기계",
        contactPerson: "김정밀",
        email: "precision.kim@korea-machinery.co.kr",
        phone: "02-1111-3333",
        address: "경기도 안양시 동안구 정밀로 456",
        notes: "국내 정밀기계 전문, 맞춤 제작, 기술력 우수",
        isActive: true,
      },
    ];

    // 기존 데이터 삭제
    console.log("기존 거래처 데이터 삭제 중...");
    await prisma.salesOrderLine.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.purchaseOrderLine.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.vendor.deleteMany();

    // 고객 데이터 생성
    console.log("고객 데이터 생성 중...");
    for (const customerData of customers) {
      await prisma.customer.create({
        data: customerData,
      });
    }

    // 공급업체 데이터 생성
    console.log("공급업체 데이터 생성 중...");
    for (const vendorData of vendors) {
      await prisma.vendor.create({
        data: vendorData,
      });
    }

    console.log("거래처 샘플 데이터 생성 완료!");
    console.log(`- 고객: ${customers.length}개`);
    console.log(`- 공급업체: ${vendors.length}개`);
  } catch (error) {
    console.error("거래처 샘플 데이터 생성 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
