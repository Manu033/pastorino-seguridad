import React from "react";

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, type = "text", placeholder = "" }) {
  return <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export function Select({ value, onChange, children }) {
  return <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label className="check">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Actions({ children }) {
  return <div className="actions">{children}</div>;
}

export function Status({ message, error }) {
  if (!message && !error) return null;
  return <div className={error ? "status error" : "status"}>{error || message}</div>;
}
