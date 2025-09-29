"use client";

import { useState, useEffect } from "react";

interface Item {
  id: string;
  code: string;
  name: string;
  brand?: { name: string };
  category?: { name: string };
  currentStock?: number;
  basePrice?: number;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface Customer {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface OrderLine {
  itemId: string;
  qty: number;
  unitPrice: number;
  total: number;
  item?: Item;
  itemSearch?: string;
  showDropdown?: boolean;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "sales" | "purchase";
  onSuccess: () => void;
}

export default function OrderModal({
  isOpen,
  onClose,
  type,
  onSuccess,
}: OrderModalProps) {
  const [orderLines, setOrderLines] = useState<OrderLine[]>([
    {
      itemId: "",
      qty: 1,
      unitPrice: 0,
      total: 0,
      itemSearch: "",
      showDropdown: false,
    },
  ]);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [orderData, setOrderData] = useState({
    customerOrVendorId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      if (type === "purchase") {
        fetchVendors();
      } else if (type === "sales") {
        fetchCustomers();
      }
    } else {
      // 모달이 닫힐 때 state 초기화
      setVendorSearch("");
      setCustomerSearch("");
      setShowVendorDropdown(false);
      setShowCustomerDropdown(false);
      setSelectedVendor(null);
      setSelectedCustomer(null);
      setOrderData({
        customerOrVendorId: "",
        orderDate: new Date().toISOString().split("T")[0],
        expectedDate: "",
        status: "pending",
        notes: "",
      });
      // 주문 라인들도 초기화
      setOrderLines([
        {
          itemId: "",
          item: undefined,
          itemSearch: "",
          showDropdown: false,
          qty: 1,
          unitPrice: 0,
          total: 0,
        },
      ]);
    }
  }, [isOpen, type]);

  // Enter 키로 인한 실수 주문 생성 방지
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && isOpen) {
        // 모달이 열려있을 때 Enter 키를 누르면 기본 동작 방지
        event.preventDefault();
        event.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showVendorDropdown && !target.closest("[data-vendor-dropdown]")) {
        setShowVendorDropdown(false);
      }
      if (showCustomerDropdown && !target.closest("[data-customer-dropdown]")) {
        setShowCustomerDropdown(false);
      }
    };

    if (showVendorDropdown || showCustomerDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showVendorDropdown, showCustomerDropdown]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/inventory", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // API 응답이 { vendors: [...] } 형태이므로 vendors 속성 추출
        setVendors(Array.isArray(data.vendors) ? data.vendors : []);
      } else {
        console.error("Failed to fetch vendors:", response.status);
        setVendors([]);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // API 응답이 { customers: [...] } 형태이므로 customers 속성 추출
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      } else {
        console.error("Failed to fetch customers:", response.status);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const handleOrderDataChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendorSearch = (value: string) => {
    setVendorSearch(value);
    setShowVendorDropdown(true); // 항상 드롭다운 표시
    if (value.length === 0) {
      setSelectedVendor(null);
      setOrderData((prev) => ({ ...prev, customerOrVendorId: "" }));
    }
  };

  const selectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(`${vendor.name} (${vendor.code})`);
    setShowVendorDropdown(false);
    setOrderData((prev) => ({ ...prev, customerOrVendorId: vendor.id }));
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true); // 항상 드롭다운 표시
    if (value.length === 0) {
      setSelectedCustomer(null);
      setOrderData((prev) => ({ ...prev, customerOrVendorId: "" }));
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.name} (${customer.code})`);
    setShowCustomerDropdown(false);
    setOrderData((prev) => ({ ...prev, customerOrVendorId: customer.id }));
  };

  const filteredVendors = (vendors || []).filter(
    (vendor) =>
      vendorSearch.length === 0 || // 검색어가 없으면 모든 공급업체 표시
      vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.code.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const filteredCustomers = (customers || []).filter(
    (customer) =>
      customerSearch.length === 0 || // 검색어가 없으면 모든 고객 표시
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleItemSearch = (index: number, value: string) => {
    const updatedLines = [...orderLines];
    updatedLines[index].itemSearch = value;
    updatedLines[index].showDropdown = value.length > 0;
    setOrderLines(updatedLines);
  };

  const selectItem = (index: number, item: Item) => {
    const updatedLines = [...orderLines];
    updatedLines[index].itemId = item.id;
    updatedLines[index].item = item;
    updatedLines[index].itemSearch = `${item.name} (${item.code})`;
    updatedLines[index].showDropdown = false;

    // 기본 판매단가가 있으면 자동으로 단가에 입력
    if (item.basePrice && item.basePrice > 0) {
      updatedLines[index].unitPrice = item.basePrice;
      const qty = Number(updatedLines[index].qty) || 0;
      const unitPrice = Number(item.basePrice) || 0;
      updatedLines[index].total = qty * unitPrice;
    }

    setOrderLines(updatedLines);
  };

  const handleLineChange = (
    index: number,
    field: keyof OrderLine,
    value: string | number
  ) => {
    const updatedLines = [...orderLines];
    (updatedLines[index] as any)[field] = value;

    if (field === "qty" || field === "unitPrice") {
      const qty = Number(updatedLines[index].qty) || 0;
      const unitPrice = Number(updatedLines[index].unitPrice) || 0;
      updatedLines[index].total = qty * unitPrice;
    }

    setOrderLines(updatedLines);
  };

  const addLine = () => {
    setOrderLines([
      ...orderLines,
      {
        itemId: "",
        qty: 1,
        unitPrice: 0,
        total: 0,
        itemSearch: "",
        showDropdown: false,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (orderLines.length > 1) {
      const updatedLines = orderLines.filter((_, i) => i !== index);
      setOrderLines(updatedLines);
    }
  };

  const totalAmount = orderLines.reduce((sum, line) => sum + line.total, 0);

  const filteredItems = (searchTerm: string) => {
    if (!searchTerm) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 주문 라인 데이터 변환
      const lines = orderLines
        .filter((line) => line.itemId && line.qty > 0)
        .map((line) => ({
          itemId: line.itemId,
          qty: Number(line.qty) || 0,
          unitPrice: Number(line.unitPrice) || 0,
          amount: Number(line.total) || 0,
        }));

      const orderPayload = {
        type,
        orderData: {
          [type === "sales" ? "customerId" : "vendorId"]:
            orderData.customerOrVendorId,
          orderDate: orderData.orderDate,
          status: orderData.status,
          totalAmount,
          notes: orderData.notes,
          lines,
        },
      };

      console.log("Order payload:", JSON.stringify(orderPayload, null, 2));

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        alert("주문이 성공적으로 생성되었습니다.");
        onSuccess();
        onClose();
        // Reset form
        setOrderLines([
          {
            itemId: "",
            qty: 1,
            unitPrice: 0,
            total: 0,
            itemSearch: "",
            showDropdown: false,
          },
        ]);
        setOrderData({
          customerOrVendorId: "",
          orderDate: new Date().toISOString().split("T")[0],
          expectedDate: "",
          status: "pending",
          notes: "",
        });
      } else {
        const error = await response.json();
        let errorMessage = `주문 생성 실패: ${
          error.error || "알 수 없는 오류"
        }`;

        // 구체적인 검증 오류 메시지가 있는 경우
        if (error.details) {
          errorMessage = `입력 데이터 오류:\n${error.details}`;
        } else if (
          error.validationErrors &&
          error.validationErrors.length > 0
        ) {
          errorMessage = `입력 데이터 오류:\n${error.validationErrors.join(
            "\n"
          )}`;
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("주문 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
          maxWidth: "800px",
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
            새 {type === "sales" ? "판매" : "구매"} 주문
          </h2>
          <button
            onClick={onClose}
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
          {/* Order Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
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
                {type === "sales" ? "고객" : "공급업체"}
              </label>
              {type === "purchase" ? (
                <div style={{ position: "relative" }} data-vendor-dropdown>
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => handleVendorSearch(e.target.value)}
                    onFocus={() => setShowVendorDropdown(true)}
                    placeholder="공급업체를 검색하세요..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: selectedVendor
                        ? "2px solid #3b82f6"
                        : "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                    required
                  />
                  {showVendorDropdown && filteredVendors.length > 0 && (
                    <div
                      data-vendor-dropdown
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#ffffff",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        maxHeight: "200px",
                        overflow: "auto",
                        zIndex: 1001,
                      }}
                    >
                      {filteredVendors.map((vendor) => (
                        <div
                          key={vendor.id}
                          onClick={() => selectVendor(vendor)}
                          style={{
                            padding: "12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                            color: "#000000",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              marginBottom: "4px",
                            }}
                          >
                            {vendor.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {vendor.code}
                            {vendor.contactPerson &&
                              ` • ${vendor.contactPerson}`}
                            {vendor.phone && ` • ${vendor.phone}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ position: "relative" }} data-customer-dropdown>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="고객을 검색하세요..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: selectedCustomer
                        ? "2px solid #3b82f6"
                        : "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                    required
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div
                      data-customer-dropdown
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#ffffff",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        maxHeight: "200px",
                        overflow: "auto",
                        zIndex: 1001,
                      }}
                    >
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          style={{
                            padding: "12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                            color: "#000000",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              marginBottom: "4px",
                            }}
                          >
                            {customer.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {customer.code}
                            {customer.contactPerson &&
                              ` • ${customer.contactPerson}`}
                            {customer.phone && ` • ${customer.phone}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                주문일
              </label>
              <input
                type="date"
                name="orderDate"
                value={orderData.orderDate}
                onChange={handleOrderDataChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
                required
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
                예정일
              </label>
              <input
                type="date"
                name="expectedDate"
                value={orderData.expectedDate}
                onChange={handleOrderDataChange}
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
                상태
              </label>
              <select
                name="status"
                value={orderData.status}
                onChange={handleOrderDataChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
              >
                <option value="pending">견적대기</option>
                <option value="confirmed">수주확정</option>
                <option value="ready_to_ship">출고대기</option>
                <option value="shipping">배송중</option>
                <option value="shipped">배송완료</option>
                <option value="payment_pending">수금대기</option>
                <option value="completed">수금완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>

          {/* Order Lines */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#000000",
                marginBottom: "16px",
              }}
            >
              주문 항목
            </h3>

            {orderLines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                  gap: "12px",
                  marginBottom: "12px",
                  alignItems: "end",
                }}
              >
                <div style={{ position: "relative" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    품목
                  </label>
                  <input
                    type="text"
                    value={line.itemSearch || ""}
                    onChange={(e) => handleItemSearch(index, e.target.value)}
                    placeholder="품목을 검색하세요..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />

                  {line.showDropdown && line.itemSearch && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#ffffff",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 6px 6px",
                        maxHeight: "200px",
                        overflow: "auto",
                        zIndex: 1001,
                      }}
                    >
                      {filteredItems(line.itemSearch || "").map(
                        (item, itemIndex) => (
                          <div
                            key={`item-${index}-${itemIndex}-${item.id}`}
                            onClick={() => selectItem(index, item)}
                            style={{
                              padding: "8px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <div
                              style={{ fontWeight: "500", color: "#374151" }}
                            >
                              {item.name} ({item.code})
                            </div>
                            <div style={{ fontSize: "10px", color: "#6b7280" }}>
                              {item.brand?.name} | {item.category?.name}
                              {item.currentStock !== undefined && (
                                <span
                                  style={{
                                    color:
                                      item.currentStock > 0
                                        ? "#10b981"
                                        : "#ef4444",
                                    marginLeft: "8px",
                                  }}
                                >
                                  재고: {item.currentStock}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    수량
                  </label>
                  <input
                    type="number"
                    value={line.qty}
                    onChange={(e) =>
                      handleLineChange(index, "qty", Number(e.target.value))
                    }
                    min="1"
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
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    단가
                  </label>
                  <input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) =>
                      handleLineChange(
                        index,
                        "unitPrice",
                        Number(e.target.value)
                      )
                    }
                    min="0"
                    step="0.01"
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
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    합계
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  >
                    ₩{line.total.toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={orderLines.length === 1}
                  style={{
                    padding: "8px",
                    background: orderLines.length === 1 ? "#f3f4f6" : "#fef2f2",
                    color: orderLines.length === 1 ? "#9ca3af" : "#dc2626",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: orderLines.length === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addLine}
              style={{
                padding: "8px 16px",
                background: "#f0f9ff",
                color: "#000000",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              + 항목 추가
            </button>
          </div>

          {/* Total Amount */}
          <div
            style={{
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                총 주문금액
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#000000",
                }}
              >
                ₩{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "4px",
              }}
            >
              비고
            </label>
            <textarea
              name="notes"
              value={orderData.notes}
              onChange={handleOrderDataChange}
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
                resize: "vertical",
              }}
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
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
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              style={{
                padding: "10px 20px",
                background: loading ? "#9ca3af" : "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "생성 중..." : "주문 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
