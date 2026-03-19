const PRIVACY_CONTENT = `
  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제1조 (개인정보의 처리 목적)</h2>
  <p className="mb-4">
    회사는 다음의 목적을 위하여 개인정보를 처리하며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
  </p>
  <ul className="list-disc list-inside mb-4">
    <li>회원 가입 및 관리: 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별/인증, 회원 자격 유지/관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정이용 방지, 만14세 미만 아동 개인정보 처리 시 법정대리인의 동의 여부 확인, 각종 고지/통지, 고충 처리 등을 목적으로 개인정보를 처리합니다.</li>
    <li>서비스 제공: 우산 대여 및 반납 서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증, 요금 결제 및 정산 등을 목적으로 개인정보를 처리합니다.</li>
    <li>마케팅 및 광고에의 활용: 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인 등을 목적으로 개인정보를 처리합니다.</li>
    <li>고객 문의 및 상담: 고객 문의에 대한 답변, 불만 처리, 서비스 개선을 위한 통계 분석 등을 목적으로 개인정보를 처리합니다.</li>
  </ul>

  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제2조 (처리하는 개인정보 항목)</h2>
  <p className="mb-4">
    회사는 서비스 제공을 위해 다음의 개인정보 항목을 처리하고 있습니다.
  </p>
  <ul className="list-disc list-inside mb-4">
    <li>필수 항목: 이름, 이메일 주소, 비밀번호</li>
    <li>선택 항목: 주소, 결제 정보 (카드 번호 일부, 유효기간 등)</li>
    <li>서비스 이용 과정에서 자동으로 생성될 수 있는 항목: 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보, 결제 기록 등</li>
  </ul>

  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제3조 (개인정보의 처리 및 보유 기간)</h2>
  <p className="mb-4">
    회사는 법령에 따른 개인정보 보유∙이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유∙이용 기간 내에서 개인정보를 처리∙보유합니다.
  </p>
  <ul className="list-disc list-inside mb-4">
    <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
    <li>서비스 제공: 서비스 종료 시까지</li>
    <li>다만, 다음의 사유에 해당하는 경우에는 해당 기간 종료 시까지</li>
    <ul className="list-circle list-inside ml-5">
      <li>「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 표시/광고, 계약내용 및 이행 등 거래에 관한 기록</li>
      <ul className="list-disc list-inside ml-5">
        <li>표시/광고에 관한 기록: 6개월</li>
        <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
        <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
      </ul>
      <li>「통신비밀보호법」에 따른 통신사실확인자료 보관</li>
      <ul className="list-disc list-inside ml-5">
        <li>컴퓨터통신, 인터넷 로그기록 자료, 접속지 추적자료: 3개월</li>
      </ul>
    </ul>

    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제4조 (개인정보의 제3자 제공)</h2>
    <p className="mb-4">
      회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적 범위 내에서 처리하며, 정보주체의 사전 동의 없이 제3자에게 제공하지 않습니다.
      다만, 다음의 경우에는 관련 법령에 따라 제3자 제공이 가능합니다.
    </p>
    <ul className="list-disc list-inside mb-4">
      <li>정보주체로부터 별도의 동의를 받은 경우</li>
      <li>법령에 특별한 규정이 있는 경우</li>
      <li>정보주체 또는 법정대리인이 의사표시를 할 수 없는 상태이거나, 긴급한 생명·신체·재산의 이익을 위해 필요하다고 인정되는 경우</li>
    </ul>

    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제5조 (개인정보의 처리 위탁)</h2>
    <p className="mb-4">
      회사는 원활한 서비스 제공을 위하여 아래와 같이 개인정보 처리업무를 외부에 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
    </p>
    <table className="w-full text-sm mb-4 border border-gray-300 dark:border-gray-600">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">
          <th className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">수탁업체명</th>
          <th className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">위탁업무</th>
          <th className="px-2 py-1">보유 및 이용기간</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">Google Web Services</td>
          <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">서비스 인프라 운영 및 데이터 저장</td>
          <td className="px-2 py-1">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
        </tr>
      </tbody>
    </table>

    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제6조 (정보주체의 권리 및 행사 방법)</h2>
    <p className="mb-4">
      정보주체는 언제든지 개인정보 열람, 정정·삭제, 처리정지 요청 등의 권리를 행사할 수 있습니다. 이와 관련하여 서면, 이메일, 고객센터 등을 통해 요청하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
    </p>
    <ul className="list-disc list-inside mb-4">
      <li>만 14세 미만 아동의 경우 법정대리인이 권리를 행사할 수 있습니다.</li>
      <li>개인정보 열람 등 요청 시 본인 여부 확인을 위한 절차가 진행될 수 있습니다.</li>
    </ul>

    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제7조 (개인정보 자동 수집 및 거부 안내)</h2>
    <p className="mb-4">
      회사는 웹사이트 이용 시 쿠키(cookie) 등의 자동 수집 장치를 통해 이용자의 정보를 저장하고 수시로 불러옵니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
    </p>
    <ul className="list-disc list-inside mb-4">
      <li>쿠키 수집 목적: 이용자 식별, 맞춤형 서비스 제공 등</li>
      <li>설정 방법: 웹 브라우저 &gt; 인터넷 옵션 &gt; 개인정보 &gt; 고급</li>
      <li>단, 쿠키 설정 거부 시 일부 서비스 이용에 제한이 있을 수 있습니다.</li>
    </ul>

    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제8조 (개인정보의 안전성 확보 조치)</h2>
    <p className="mb-4">
      회사는 개인정보의 안전성 확보를 위해 다음과 같은 기술적·관리적·물리적 조치를 취하고 있습니다.
    </p>
    <ul className="list-disc list-inside mb-4">
      <li>개인정보 접근 제한 및 관리 체계 수립</li>
      <li>개인정보 암호화 저장 (비밀번호, 결제정보 등)</li>
      <li>해킹이나 악성 코드 등에 대비한 보안 프로그램 설치 및 주기적 점검</li>
      <li>개인정보 처리 직원의 최소화 및 교육 시행</li>
    </ul>

    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">제9조 (개인정보 보호 책임자)</h2>
    <p className="mb-2">
      회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 관련 문의사항 처리 등을 위한 개인정보 보호 책임자를 지정하고 있습니다.
    </p>
    <ul className="list-inside list-disc mb-4">
      <li>성명: hoya</li>
      <li>직책: 개인정보 보호책임자</li>
      <li>연락처: <a className="text-blue-600 hover:underline" href="mailto:privacy@fourier.site">privacy@fourier.site</a></li>
    </ul>

    <p className="text-sm text-gray-500 mt-8">
      본 개인정보 처리방침은 관련 법령 및 회사 정책에 따라 변경될 수 있으며, 변경 시 홈페이지를 통해 사전 고지합니다. <br />
      본 방침은 2026년 03월 19일부터 시행됩니다.
    </p>
  </ul>

  <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
    본 개인정보 처리 방침은 2026년 03월 19일부터 적용됩니다.
  </p>
`;

export default PRIVACY_CONTENT;