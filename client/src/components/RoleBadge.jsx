const RoleBadge = ({ role }) => {
  const colors = {
    admin: { bg: "#ede9fe", text: "#5b21b6", label: "Admin" },
    manager: { bg: "#dbeafe", text: "#1e40af", label: "Manager" },
    employee: { bg: "#e0f2fe", text: "#0369a1", label: "Employee" },
    "Approval-Pending": { bg: "#fef3c7", text: "#92400e", label: "Approval Pending" },
  };
  const c = colors[role] || { bg: "#f3f4f6", text: "#374151", label: role || "User" };

  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
};

export default RoleBadge;
