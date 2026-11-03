const Footer = () => {
  return (
    <footer
      className="mt-auto border-t py-4 px-4 sm:px-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
        <p>
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            Swiftly
          </span>{" "}
          — Employee Leave and Reimbursement Management System.
        </p>
        <p className="hidden sm:block">
          Academic Project Portal
        </p>
      </div>
    </footer>
  );
};

export default Footer;
