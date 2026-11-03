import { useState, useMemo } from "react";
import { FiTrash2, FiDownload } from "react-icons/fi";
import RoleBadge from "./RoleBadge";
import ConfirmModal from "./ConfirmModal";

const UserTable = ({ users = [], onUpdateRole, onDeleteUser }) => {
  const [modal, setModal] = useState({
    open: false,
    userId: null,
    userName: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const openModal = (id, name) =>
    setModal({ open: true, userId: id, userName: name });

  const closeModal = () =>
    setModal({ open: false, userId: null, userName: "" });

  const handleConfirmDelete = () => {
    if (modal.userId) onDeleteUser(modal.userId);
    closeModal();
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        (u.department && u.department.toLowerCase().includes(term));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const exportCSV = () => {
    const headers = ["Name", "Email", "Department", "Role", "Total Leave Days"];
    const rows = filteredUsers.map((u) => [
      u.name,
      u.email,
      u.department || "General",
      u.role,
      u.totalLeaveDays ?? 20,
    ]);

    const escapeCSVCell = (cell) => {
      const value = String(cell ?? "");
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replace(/"/g, '""')}"`;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSVCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employee-records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <ConfirmModal
        isOpen={modal.open}
        title="Delete User"
        message={`Are you sure you want to delete "${modal.userName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={closeModal}
      />

      {/* Search + Filter + Export Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by name, email, department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none sm:max-w-xs"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
          >
            <option value="all">All Roles</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="Approval-Pending">Approval Pending</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
            }}
            className="rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
          >
            Reset
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition cursor-pointer"
            style={{ backgroundColor: "#6366f1" }}
          >
            <FiDownload size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
      </div>

      <div
        className="overflow-x-auto rounded-xl border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        {filteredUsers.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            No matching users found
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                {["Name", "Email", "Department", "Role", "Role Assignment", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const uid = u.id || u._id;
                return (
                  <tr
                    key={uid}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3 font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {u.name}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {u.email}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {u.department || "General"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "admin" ? (
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateRole(uid, e.target.value)}
                          className="cursor-pointer rounded-lg border px-2 py-1 text-xs outline-none"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {u.role === "Approval-Pending" && (
                            <option value="Approval-Pending">Approval Pending</option>
                          )}
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          System Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => openModal(uid, u.name)}
                          title="Delete user account"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }}
                        >
                          <FiTrash2 size={13} />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default UserTable;
