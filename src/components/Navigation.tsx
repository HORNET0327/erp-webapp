"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ChangePasswordModal from "./ChangePasswordModal";
import { isAdmin, isLeadUserOrAbove } from "@/lib/permissions";

interface NavigationProps {
  currentUser?: string;
}

export default function Navigation({ currentUser }: NavigationProps) {
  const pathname = usePathname();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      // Get current user's roles
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.roles) {
          const roles = data.user.roles.map((role: any) => role.name);
          setUserRoles(roles);
        }
      } else if (response.status === 401) {
        // Not logged in, redirect to login
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { href: "/dashboard", label: "대시보드", icon: "📊" },
    { href: "/inventory", label: "재고관리", icon: "📦" },
    { href: "/customers", label: "거래처관리", icon: "👥" },
    { href: "/orders", label: "주문관리", icon: "📋" },
    { href: "/reports", label: "보고서", icon: "📈" },
  ];

  // Add users menu for Lead User and Admin
  if (isLeadUserOrAbove(userRoles)) {
    menuItems.push({ href: "/users", label: "사용자관리", icon: "👤" });
  }

  return (
    <nav
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          ERP 시스템
        </Link>

        <div style={{ display: "flex", gap: 8 }}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                color: pathname === item.href ? "#111827" : "#000000",
                background: pathname === item.href ? "#f3f4f6" : "transparent",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {currentUser && (
          <>
            <span
              style={{
                fontSize: 14,
                color: "#000000",
                fontWeight: 500,
              }}
            >
              {currentUser}
            </span>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              설정
            </button>
          </>
        )}
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
              });
              if (response.ok) {
                window.location.href = "/login";
              }
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
          style={{
            padding: "8px 16px",
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        username={currentUser || ""}
      />
    </nav>
  );
}
