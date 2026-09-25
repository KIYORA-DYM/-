import { useState } from "react";

const STATUSES = ["テレアポ", "リスケ", "落ち", "長期追い", "案件化"];
const PRIORITIES = ["高", "中", "低"];

const initialForm = {
  company_name: "",
  phone: "",
  ceo_name: "",
  description: "",
  website: "",
  contact_name: "",
  status: "テレアポ",
  priority: "中",
  next_follow_up_date: "",
  due_date: "",
};

export function QuickAddWizard({ onSubmit, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setError("会社名は必須です");
      return;
    }
    setError("");
    onSubmit({
      title: form.company_name,
      company_name: form.company_name,
      phone: form.phone,
      ceo_name: form.ceo_name,
      description: form.description,
      website: form.website,
      contact_name: form.contact_name,
      status: form.status,
      priority: form.priority,
      next_follow_up_date: form.next_follow_up_date || null,
      due_date: form.due_date || null,
    });
  }

  return (
    <form className="quick-add-form" onSubmit={handleSubmit}>
      {error && <p className="error-text">{error}</p>}

      <label>
        企業名
        <input
          value={form.company_name}
          onChange={(e) => handleChange("company_name", e.target.value)}
          placeholder="株式会社〇〇"
          autoFocus
          required
        />
      </label>

      <label>
        電話番号
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="03-1234-5678"
        />
      </label>

      <label>
        社長名
        <input
          value={form.ceo_name}
          onChange={(e) => handleChange("ceo_name", e.target.value)}
          placeholder="代表 山田太郎"
        />
      </label>

      <label>
        タスク
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          placeholder="例: 12月ごろに改めて連絡してほしいとのこと"
        />
      </label>

      <details className="quick-add-more">
        <summary>その他の項目(任意)</summary>

        <div className="form-row">
          <label>
            ステータス
            <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            優先度
            <select value={form.priority} onChange={(e) => handleChange("priority", e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          企業URL
          <input
            type="url"
            value={form.website}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <label>
          先方担当者
          <input
            value={form.contact_name}
            onChange={(e) => handleChange("contact_name", e.target.value)}
            placeholder="山田様"
          />
        </label>

        <div className="form-row">
          <label className="follow-up-field">
            次回フォロー予定日
            <input
              type="date"
              value={form.next_follow_up_date}
              onChange={(e) => handleChange("next_follow_up_date", e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
            />
          </label>
          <label>
            期限
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
            />
          </label>
        </div>
      </details>

      <div className="form-actions">
        <button type="submit">登録する</button>
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
}
