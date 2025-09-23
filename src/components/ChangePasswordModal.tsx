"use client";
import { useState, useEffect } from "react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  username,
}: UserProfileModalProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "email">(
    "profile"
  );

  // 이메일 설정 상태
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: "false",
    smtpUser: "",
    smtpPass: "",
    smtpFromName: "ERP 시스템",
  });
  const [testEmail, setTestEmail] = useState("");

  // 사용자 정보 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEmail(data.user?.email || "");
        setPhone(data.user?.phone || "");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch("/api/users/email-settings", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEmailSettings(
          data.settings || {
            smtpHost: "",
            smtpPort: "587",
            smtpSecure: "false",
            smtpUser: "",
            smtpPass: "",
            smtpFromName: "ERP 시스템",
          }
        );
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    setLoading(true);

    try {
      const response = await fetch("/api/users/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || "프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 6) {
      setError("새 비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      console.log("Sending email settings:", emailSettings);

      const response = await fetch("/api/users/email-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(emailSettings),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        setSuccess("이메일 설정이 저장되었습니다.");
        // 성공 후 2초 뒤에 모달 닫기
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(data.error || "이메일 설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving email settings:", error);
      setError("이메일 설정 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError("테스트 이메일 주소를 입력해주세요.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          to: testEmail,
          settings: emailSettings,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("테스트 이메일이 발송되었습니다.");
      } else {
        setError(data.error || "테스트 이메일 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      setError("테스트 이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPhone("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setActiveTab("profile");
    setTestEmail("");
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
          width: "500px",
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
            사용자 설정
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

        <div
          style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}
        >
          사용자: <strong>{username}</strong>
        </div>

        {/* 탭 메뉴 */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              borderBottom:
                activeTab === "profile"
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === "profile" ? "#3b82f6" : "#6b7280",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            프로필 정보
          </button>
          <button
            onClick={() => setActiveTab("password")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              borderBottom:
                activeTab === "password"
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === "password" ? "#3b82f6" : "#6b7280",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            비밀번호 변경
          </button>
          <button
            onClick={() => {
              setActiveTab("email");
              fetchEmailSettings();
            }}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              borderBottom:
                activeTab === "email"
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === "email" ? "#3b82f6" : "#6b7280",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            이메일 설정
          </button>
        </div>

        {/* 프로필 정보 탭 */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit}>
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
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  color: email ? "#000000" : "#9ca3af",
                }}
              />
            </div>

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
                전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  color: phone ? "#000000" : "#9ca3af",
                }}
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
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}

        {/* 비밀번호 변경 탭 */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit}>
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
                현재 비밀번호
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  color: currentPassword ? "#000000" : "#9ca3af",
                }}
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
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  color: newPassword ? "#000000" : "#9ca3af",
                }}
              />
            </div>

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
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  color: confirmPassword ? "#000000" : "#9ca3af",
                }}
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
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        )}

        {/* 이메일 설정 탭 */}
        {activeTab === "email" && (
          <div>
            <form onSubmit={handleEmailSettingsSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  SMTP 호스트
                </label>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  이메일 서버 주소 • Gmail: smtp.gmail.com • 네이버:
                  smtp.naver.com • 다음: smtp.daum.net
                </p>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpHost: e.target.value,
                    })
                  }
                  placeholder="smtp.gmail.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    color: "#000000",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  SMTP 포트
                </label>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  이메일 서버 포트 번호 • Gmail: 587 (TLS) 또는 465 (SSL) •
                  네이버: 587 (TLS) 또는 465 (SSL) • 다음: 587 (TLS) 또는 465
                  (SSL)
                </p>
                <input
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpPort: e.target.value,
                    })
                  }
                  placeholder="587"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    color: "#000000",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  보안 연결
                </label>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  이메일 전송 시 사용할 암호화 방식 (대부분 TLS 권장)
                </p>
                <select
                  value={emailSettings.smtpSecure}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpSecure: e.target.value,
                    })
                  }
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
                  <option value="false">TLS (587)</option>
                  <option value="true">SSL (465)</option>
                </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  이메일 주소
                </label>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  이메일 발송에 사용할 계정 주소 (Gmail, 네이버, 다음 등)
                </p>
                <input
                  type="email"
                  value={emailSettings.smtpUser}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpUser: e.target.value,
                    })
                  }
                  placeholder="your_email@gmail.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    color: "#000000",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  앱 비밀번호
                </label>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  이메일 계정 비밀번호 • Gmail: 앱 비밀번호 생성 필요 (2단계
                  인증 활성화 후) • 네이버/다음: 계정 비밀번호 또는 앱 비밀번호
                </p>
                <input
                  type="password"
                  value={emailSettings.smtpPass}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpPass: e.target.value,
                    })
                  }
                  placeholder="앱 비밀번호 또는 계정 비밀번호"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    color: "#000000",
                  }}
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
                  발신자 이름
                </label>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                    lineHeight: "1.3",
                  }}
                >
                  이메일 수신자에게 표시될 발신자 이름 (회사명, 부서명 등)
                </p>
                <input
                  type="text"
                  value={emailSettings.smtpFromName}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpFromName: e.target.value,
                    })
                  }
                  placeholder="ERP 시스템"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    color: "#000000",
                  }}
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
                  marginBottom: "20px",
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
                  {loading ? "저장 중..." : "설정 저장"}
                </button>
              </div>
            </form>

            {/* 테스트 이메일 발송 */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "12px",
                }}
              >
                테스트 이메일 발송
              </h3>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
              >
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="테스트 이메일 주소"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#000000",
                  }}
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={loading || !testEmail}
                  style={{
                    padding: "8px 16px",
                    backgroundColor:
                      loading || !testEmail ? "#9ca3af" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: loading || !testEmail ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "발송 중..." : "테스트 발송"}
                </button>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                설정을 저장한 후 테스트 이메일을 발송해보세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
