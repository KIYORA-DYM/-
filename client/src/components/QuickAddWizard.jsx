import { useState } from "react";

const STATUSES = ["テレアポ", "リスケ", "落ち", "長期追い", "案件化"];
const PRIORITIES = ["高", "中", "低"];

const STEPS = [
  { key: "basic", label: "基本情報" },
  { key: "status", label: "ステータス" },
  { key: "detail", label: "詳細(任意)" },
];

const initialForm = {
  company_name: "",
  website: "",
  phone: "",
  title: "",
  status: "テレアポ",
  priority: "中",
  contact_name: "",
  next_follow_up_date: "",
  description: "",
  due_date: "",
};

export function QuickAddWizard({ onSubmit, onCancel }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    return {
      title: form.title.trim() || form.company_name,
      company_name: form.company_name,
      website: form.website,
      phone: form.phone,
      status: form.status,
      priority: form.priority,
      contact_name: form.contact_name,
      next_follow_up_date: form.next_follow_up_date || null,
      description: form.description,
      due_date: form.due_date || null,
    };
  }

  function handleSave() {
    if (!form.company_name.trim()) {
      setError("会社名は必須です");
      setStep(0);
      return;
    }
    setError("");
    onSubmit(buildPayload());
  }

  function goNext() {
    if (step === 0 && !form.company_name.trim()) {
      setError("会社名は必須です");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="wizard">
      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`wizard-step-indicator ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
            {i + 1}. {s.label}
          </div>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      {step === 0 && (
        <div className="wizard-panel">
          <label>
            会社名
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
          <p className="field-hint">
            会社名だけ入力すれば、そのまま保存できます。詳細はあとから編集できます。
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-panel">
          {form.status !== "テレアポ" && (
            <label>
              案件名(空欄なら会社名を使用)
              <input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={form.company_name || "案件名"}
              />
            </label>
          )}
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
        </div>
      )}

      {step === 2 && (
        <div className="wizard-panel">
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
            />
          </label>
          <label>
            メモ
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="例: 12月ごろに改めて連絡してほしいとのこと"
            />
          </label>
        </div>
      )}

      <div className="wizard-actions">
        <div className="wizard-actions-left">
          {step > 0 && (
            <button type="button" className="secondary" onClick={goBack}>
              戻る
            </button>
          )}
          <button type="button" className="secondary" onClick={onCancel}>
            キャンセル
          </button>
        </div>
        <div className="wizard-actions-right">
          <button type="button" className="secondary" onClick={handleSave}>
            この内容で登録
          </button>
          {step < STEPS.length - 1 && (
            <button type="button" onClick={goNext}>
              次へ
            </button>
          )}
          {step === STEPS.length - 1 && <button type="button" onClick={handleSave}>登録する</button>}
        </div>
      </div>
    </div>
  );
}
