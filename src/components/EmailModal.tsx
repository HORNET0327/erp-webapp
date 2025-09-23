"use client";
import { useState } from "react";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "general" | "quotation" | "order";
  orderId?: string;
  customerEmail?: string;
  customerName?: string;
}

export default function EmailModal({
  isOpen,
  onClose,
  type,
  orderId,
  customerEmail,
  customerName,
}: EmailModalProps) {
  const [formData, setFormData] = useState({
    to: customerEmail || "",
    subject: "",
    message: "",
    type: "info" as "info" | "warning" | "error" | "success",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let response;

      if (type === "quotation" && orderId) {
        response = await fetch("/api/email/quotation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            orderId,
            to: formData.to,
            subject: formData.subject,
            message: formData.message,
          }),
        });
      } else {
        response = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        if (data.warning) {
          setSuccess(data.message);
          setError(data.warning);
        } else {
          setSuccess(data.message);
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setError(data.error || "이메일 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setError("이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      to: customerEmail || "",
      subject: "",
      message: "",
      type: "info",
    });
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "600px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#000000",
              margin: 0,
            }}
          >
            {type === "quotation"
              ? "견적서 이메일 발송"
              : type === "order"
              ? "주문서 이메일 발송"
              : "이메일 발송"}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
              }}
            >
              받는 사람 *
            </label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              required
              multiple
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                color: "#000000",
              }}
              placeholder="이메일 주소를 입력하세요 (여러 개는 쉼표로 구분)"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
              }}
            >
              제목 *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                color: "#000000",
              }}
              placeholder={
                type === "quotation"
                  ? "견적서 관련 제목을 입력하세요"
                  : type === "order"
                  ? "주문서 관련 제목을 입력하세요"
                  : "이메일 제목을 입력하세요"
              }
            />
          </div>

          {type === "general" && (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                }}
              >
                알림 유형
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  color: "#000000",
                }}
              >
                <option value="info">정보</option>
                <option value="success">성공</option>
                <option value="warning">경고</option>
                <option value="error">오류</option>
              </select>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
              }}
            >
              메시지 {type === "general" ? "*" : ""}
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required={type === "general"}
              rows={6}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                resize: "vertical",
                color: "#000000",
              }}
              placeholder={
                type === "quotation"
                  ? "견적서 관련 추가 메시지를 입력하세요 (선택사항)"
                  : type === "order"
                  ? "주문서 관련 추가 메시지를 입력하세요 (선택사항)"
                  : "메시지를 입력하세요"
              }
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {success}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "발송 중..." : "이메일 발송"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
