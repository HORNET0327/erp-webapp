"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavigationProps {
  currentUser?: string;
}

export default function Navigation({ currentUser }: NavigationProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Check if user has admin role by calling users endpoint
      const response = await fetch("/api/users", {
        credentials: "include",
      });

      if (response.status === 200) {
        // User has access to users endpoint, so they are admin
        setIsAdmin(true);
      } else if (response.status === 403) {
        // User is logged in but not admin
        setIsAdmin(false);
      } else if (response.status === 401) {
        // Not logged in, redirect to login
        window.location.href = "/login";
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
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

  // Add users menu only for admin users
  if (isAdmin) {
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
          <span
            style={{
              fontSize: 14,
              color: "#000000",
              fontWeight: 500,
            }}
          >
            {currentUser}
          </span>
        )}
        <Link
          href="/logout"
          style={{
            padding: "8px 16px",
            background: "#ef4444",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          로그아웃
        </Link>
      </div>
    </nav>
  );
}
