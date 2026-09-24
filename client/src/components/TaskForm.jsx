import { useEffect, useState } from "react";
import { NextActionChecklist } from "./NextActionChecklist";
import { MeetingMinutes } from "./MeetingMinutes";
import { contractMonthsElapsed } from "../utils/contract";

const DEFAULT_STATUS_OPTIONS = ["テレアポ", "リスケ", "落ち", "長期追い", "案件化"];
const PRIORITIES = ["高", "中", "低"];

const emptyTask = {
  title: "",
  description: "",
  status: "テレアポ",
  priority: "中",
  start_date: "",
  due_date: "",
  company_name: "",
  ceo_name: "",
  contact_name: "",
  contact_title: "",
  contact_email: "",
  phone: "",
  next_follow_up_date: "",
  contract_month: "",
};

export function TaskForm({
  initialTask,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  defaultStatus = "テレアポ",
  onSubmit,
  onCancel,
}) {
  const [task, setTask] = useState(initialTask || { ...emptyTask, status: defaultStatus });

  useEffect(() => {
    setTask(initialTask || { ...emptyTask, status: defaultStatus });
  }, [initialTask, defaultStatus]);

  function handleChange(field, value) {
    setTask((prev) => ({ ...prev, [field]: value }));
  }

  const isExistingClient = task.status === "既存企業";

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...task,
      title: isExistingClient ? task.company_name || task.title : task.title,
      start_date: task.start_date || null,
      due_date: task.due_date || null,
      next_follow_up_date: task.next_follow_up_date || null,
      contract_month: task.contract_month || null,
    });
  }

  return (
    <div>
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{initialTask ? "編集" : isExistingClient ? "既存企業を追加" : "新しい案件を追加"}</h2>

      {!isExistingClient && (
        <label>
          タイトル
          <input
            value={task.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </label>
      )}

      <div className="form-row">
        <label>
          会社名
          <input
            value={task.company_name || ""}
            onChange={(e) => handleChange("company_name", e.target.value)}
            placeholder="株式会社〇〇"
            required={isExistingClient}
          />
        </label>
        {isExistingClient && (
          <label>
            社長名
            <input
              value={task.ceo_name || ""}
              onChange={(e) => handleChange("ceo_name", e.target.value)}
              placeholder="代表 山田太郎"
            />
          </label>
        )}
      </div>

      <div className="form-row">
        <label>
          担当者役職
          <input
            value={task.contact_title || ""}
            onChange={(e) => handleChange("contact_title", e.target.value)}
            placeholder="営業部長"
          />
        </label>
        <label>
          先方担当者名
          <input
            value={task.contact_name || ""}
            onChange={(e) => handleChange("contact_name", e.target.value)}
            placeholder="山田様"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          電話番号
          <input
            type="tel"
            value={task.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="03-1234-5678"
          />
        </label>
        {isExistingClient && (
          <label>
            連絡先メールアドレス
            <input
              type="email"
              value={task.contact_email || ""}
              onChange={(e) => handleChange("contact_email", e.target.value)}
              placeholder="tantou@example.com"
            />
          </label>
        )}
      </div>

      <label>
        {isExistingClient ? "備考" : "詳細・経緯"}
        <textarea
          value={task.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={isExistingClient ? 8 : 3}
          placeholder={
            isExistingClient
              ? "取引の背景、注意事項など自由に記入してください"
              : "例: 12月ごろに改めて連絡してほしいとのこと"
          }
        />
      </label>

      <label className="follow-up-field">
        次回フォロー予定日
        <input
          type="date"
          value={task.next_follow_up_date || ""}
          onChange={(e) => handleChange("next_follow_up_date", e.target.value)}
        />
        <span className="field-hint">
          「〇月ごろ」と言われた場合はその月の1日など、目安の日付を入れてください。近づくとダッシュボード上部に表示されます。
        </span>
      </label>

      <div className="form-row">
        <label>
          ステータス
          <select value={task.status} onChange={(e) => handleChange("status", e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          優先度
          <select value={task.priority} onChange={(e) => handleChange("priority", e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {task.status === "既存企業" && (
        <label className="follow-up-field">
          契約月
          <input
            type="month"
            value={task.contract_month || ""}
            onChange={(e) => handleChange("contract_month", e.target.value)}
          />
          <span className="field-hint">
            {task.contract_month
              ? `契約${contractMonthsElapsed(task.contract_month)}ヶ月目`
              : "契約を開始した月を選択してください"}
          </span>
        </label>
      )}

      <div className="form-row">
        <label>
          開始日
          <input
            type="date"
            value={task.start_date || ""}
            onChange={(e) => handleChange("start_date", e.target.value)}
          />
        </label>

        <label>
          期限
          <input
            type="date"
            value={task.due_date || ""}
            onChange={(e) => handleChange("due_date", e.target.value)}
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit">保存</button>
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
    {initialTask?.id && !isExistingClient && <NextActionChecklist taskId={initialTask.id} />}
    {initialTask?.id && isExistingClient && <MeetingMinutes taskId={initialTask.id} />}
    </div>
  );
}
