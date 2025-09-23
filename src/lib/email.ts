import nodemailer from "nodemailer";

// 이메일 설정 인터페이스
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 이메일 발송 옵션 인터페이스
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// 이메일 발송 클래스
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(settings?: {
    smtpHost?: string;
    smtpPort?: string;
    smtpSecure?: string;
    smtpUser?: string;
    smtpPass?: string;
    smtpFromName?: string;
  }) {
    // 사용자 설정이 있으면 사용, 없으면 환경변수 사용
    const config: EmailConfig = {
      host: settings?.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(settings?.smtpPort || process.env.SMTP_PORT || "587"),
      secure: (settings?.smtpSecure || process.env.SMTP_SECURE) === "true",
      auth: {
        user: settings?.smtpUser || process.env.SMTP_USER || "",
        pass: settings?.smtpPass || process.env.SMTP_PASS || "",
      },
    };

    // 이메일 설정이 완전하지 않은 경우 더미 transporter 생성
    if (!config.auth.user || !config.auth.pass) {
      console.warn(
        "이메일 설정이 완전하지 않습니다. SMTP 설정을 확인해주세요."
      );
      // 더미 transporter 생성 (실제 발송은 하지 않음)
      this.transporter = {
        sendMail: async () => {
          console.log("이메일 설정이 없어 실제 발송하지 않습니다.");
          throw new Error("이메일 설정이 완전하지 않습니다.");
        },
      } as any;
    } else {
      this.transporter = nodemailer.createTransport(config);
    }
  }

  // 이메일 발송 메서드
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || "ERP 시스템"}" <${
          process.env.SMTP_USER || ""
        }>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("이메일 발송 성공:", result.messageId);
      return true;
    } catch (error) {
      console.error("이메일 발송 실패:", error);
      return false;
    }
  }

  // 견적서 이메일 발송 (PDF 첨부)
  async sendQuotationEmailWithPDF(
    to: string,
    customerName: string,
    quotationNo: string,
    totalAmount: number,
    pdfBuffer: Buffer,
    customSubject?: string,
    customMessage?: string
  ): Promise<boolean> {
    const subject = customSubject || `[견적서] 견적서 ${quotationNo} - SNDTEC`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          견적서 발송
        </h2>
        <p>안녕하세요, <strong>${customerName}</strong>님</p>
        <p>요청하신 견적서를 발송해드립니다.</p>
        
        ${
          customMessage
            ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-style: italic; color: #1e40af;">${customMessage}</p>
        </div>
        `
            : ""
        }
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">견적서 정보</h3>
          <p><strong>견적번호:</strong> ${quotationNo}</p>
          <p><strong>총 금액:</strong> ₩${totalAmount.toLocaleString()}</p>
          <p><strong>발송일:</strong> ${new Date().toLocaleDateString(
            "ko-KR"
          )}</p>
        </div>
        
        <p>자세한 내용은 첨부된 견적서 PDF를 확인해주세요.</p>
        <p>문의사항이 있으시면 언제든 연락주시기 바랍니다.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>SNDTEC</strong><br>
            서울시 강남구 테헤란로 123<br>
            전화: 02-1234-5678 | 이메일: info@sndtec.com
          </p>
        </div>
      </div>
    `;

    const attachments = [
      {
        filename: `견적서_${quotationNo}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    return await this.sendEmail({
      to,
      subject,
      html,
      attachments,
    });
  }

  // 견적서 이메일 발송 (기존)
  async sendQuotationEmail(
    to: string,
    customerName: string,
    quotationNo: string,
    totalAmount: number,
    pdfBuffer?: Buffer
  ): Promise<boolean> {
    const subject = `[견적서] ${quotationNo} - ${customerName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          견적서 발송
        </h2>
        <p>안녕하세요, <strong>${customerName}</strong>님</p>
        <p>요청하신 견적서를 발송해드립니다.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">견적서 정보</h3>
          <p><strong>견적번호:</strong> ${quotationNo}</p>
          <p><strong>총 금액:</strong> ₩${totalAmount.toLocaleString()}</p>
          <p><strong>발송일:</strong> ${new Date().toLocaleDateString(
            "ko-KR"
          )}</p>
        </div>
        
        <p>자세한 내용은 첨부된 견적서를 확인해주세요.</p>
        <p>문의사항이 있으시면 언제든 연락주시기 바랍니다.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>SND</strong><br>
            경기도 안산시 단원구 성곡로 176 (성곡동, 타원TAKRA 623호)<br>
            전화: 031-434-6862 | 팩스: 031-434-6866
          </p>
        </div>
      </div>
    `;

    const attachments = pdfBuffer
      ? [
          {
            filename: `견적서_${quotationNo}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : undefined;

    return await this.sendEmail({
      to,
      subject,
      html,
      attachments,
    });
  }

  // 주문서 이메일 발송
  async sendOrderEmail(
    to: string,
    customerName: string,
    orderNo: string,
    totalAmount: number,
    status: string
  ): Promise<boolean> {
    const subject = `[주문서] ${orderNo} - ${customerName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
          주문서 발송
        </h2>
        <p>안녕하세요, <strong>${customerName}</strong>님</p>
        <p>주문서가 발송되었습니다.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">주문서 정보</h3>
          <p><strong>주문번호:</strong> ${orderNo}</p>
          <p><strong>총 금액:</strong> ₩${totalAmount.toLocaleString()}</p>
          <p><strong>상태:</strong> ${status}</p>
          <p><strong>발송일:</strong> ${new Date().toLocaleDateString(
            "ko-KR"
          )}</p>
        </div>
        
        <p>주문 진행 상황은 시스템에서 확인하실 수 있습니다.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>SND</strong><br>
            경기도 안산시 단원구 성곡로 176 (성곡동, 타원TAKRA 623호)<br>
            전화: 031-434-6862 | 팩스: 031-434-6866
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  // 알림 이메일 발송
  async sendNotificationEmail(
    to: string | string[],
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success" = "info"
  ): Promise<boolean> {
    const colorMap = {
      info: "#3b82f6",
      warning: "#f59e0b",
      error: "#ef4444",
      success: "#10b981",
    };

    const subject = `[알림] ${title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid ${
          colorMap[type]
        }; padding-bottom: 10px;">
          ${title}
        </h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; line-height: 1.6;">${message}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          발송일: ${new Date().toLocaleString("ko-KR")}
        </p>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }
}

// 싱글톤 인스턴스
export const emailService = new EmailService();
