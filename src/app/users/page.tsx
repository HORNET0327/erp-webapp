"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { isAdmin, isLeadUserOrAbove } from "@/lib/permissions";

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  userRoles: {
    id: string;
    role: {
      id: string;
      name: string;
    };
  }[];
  userInfo: {
    employeeCode: string;
    departmentCode: string;
    jobTitle: string;
    phone: string;
    mobile: string;
    addressLine1: string;
    hireDate: string | null;
    birthDate: string | null;
    gender: string | null;
  } | null;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    employeeCode: "",
    departmentCode: "",
    jobTitle: "",
    phone: "",
    mobile: "",
    addressLine1: "",
    hireDate: "",
    birthDate: "",
    gender: "",
    roleIds: [] as string[],
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(
          data.user?.username ||
            data.user?.name ||
            data.user?.email ||
            "Unknown"
        );
        if (data.user?.roles) {
          const roles = data.user.roles.map((role: any) => role.name);
          setCurrentUserRoles(roles);
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      employeeCode: user.userInfo?.employeeCode || "",
      departmentCode: user.userInfo?.departmentCode || "",
      jobTitle: user.userInfo?.jobTitle || "",
      phone: user.userInfo?.phone || "",
      mobile: user.userInfo?.mobile || "",
      addressLine1: user.userInfo?.addressLine1 || "",
      hireDate: user.userInfo?.hireDate?.split("T")[0] || "",
      birthDate: user.userInfo?.birthDate?.split("T")[0] || "",
      gender: user.userInfo?.gender || "",
      roleIds: user.userRoles.map((ur) => ur.role.id),
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert("사용자가 삭제되었습니다.");
        fetchUsers();
      } else {
        alert("사용자 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("사용자 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: checked
        ? [...prev.roleIds, roleId]
        : prev.roleIds.filter((id) => id !== roleId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(
          editingUser ? "사용자가 수정되었습니다." : "사용자가 생성되었습니다."
        );
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          username: "",
          email: "",
          password: "",
          employeeCode: "",
          departmentCode: "",
          jobTitle: "",
          phone: "",
          mobile: "",
          addressLine1: "",
          hireDate: "",
          birthDate: "",
          gender: "",
          roleIds: [],
        });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("사용자 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navigation currentUser={currentUser} />

      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              사용자 관리
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#000000",
                margin: 0,
              }}
            >
              시스템 사용자와 권한을 관리하세요
            </p>
          </div>
          {isAdmin(currentUserRoles) && (
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  username: "",
                  email: "",
                  password: "",
                  employeeCode: "",
                  departmentCode: "",
                  jobTitle: "",
                  phone: "",
                  mobile: "",
                  addressLine1: "",
                  hireDate: "",
                  birthDate: "",
                  gender: "",
                  roleIds: [],
                });
                setShowModal(true);
              }}
              style={{
                padding: "12px 24px",
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              + 새 사용자
            </button>
          )}
        </div>

        {/* Users Table */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#000000",
              }}
            >
              데이터를 불러오는 중...
            </div>
          ) : (
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      사용자명
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      이메일
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      부서
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      직책
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      권한
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        <div style={{ fontWeight: "500" }}>{user.username}</div>
                        <div style={{ fontSize: "12px", color: "#000000" }}>
                          {user.userInfo?.employeeCode || "-"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        {user.userInfo?.departmentCode || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        {user.userInfo?.jobTitle || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                          }}
                        >
                          {user.userRoles.map((userRole, index) => (
                            <span
                              key={userRole.id || `role-${user.id}-${index}`}
                              style={{
                                padding: "2px 6px",
                                background: "#dbeafe",
                                color: "#1e40af",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "500",
                              }}
                            >
                              {userRole.role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          {isAdmin(currentUserRoles) && (
                            <>
                              <button
                                onClick={() => handleEdit(user)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#f59e0b",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                삭제
                              </button>
                            </>
                          )}
                          {!isAdmin(currentUserRoles) && (
                            <span
                              style={{ color: "#6b7280", fontSize: "12px" }}
                            >
                              조회만 가능
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !loading && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#000000",
                  }}
                >
                  등록된 사용자가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#000000",
                  margin: 0,
                }}
              >
                {editingUser ? "사용자 수정" : "새 사용자 추가"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#000000",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    사용자명 *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    이메일 *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                </div>

                {!editingUser && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#000000",
                        marginBottom: "4px",
                      }}
                    >
                      비밀번호 *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#000000",
                      }}
                    />
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    사원번호
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    부서
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    직책
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    연락처
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                    marginBottom: "8px",
                  }}
                >
                  권한
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={(e) =>
                          handleRoleChange(role.id, e.target.checked)
                        }
                        style={{ marginRight: "4px" }}
                      />
                      <span style={{ fontSize: "14px", color: "#000000" }}>
                        {role.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#f3f4f6",
                    color: "#000000",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    background: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {editingUser ? "수정" : "생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
