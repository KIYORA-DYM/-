import { useEffect, useRef, useState } from "react";
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
  website: "",
  ceo_name: "",
  contact_name: "",
  contact_title: "",
  contact_email: "",
  phone: "",
  next_follow_up_date: "",
  contract_month: "",
};

const AUTOSAVE_DELAY = 800;

export function TaskForm({
  initialTask,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  defaultStatus = "テレアポ",
  onSubmit,
  onCancel,
}) {
  const isEditMode = !!initialTask;
  const [task, setTask] = useState(initialTask || { ...emptyTask, status: defaultStatus });
  const [saveState, setSaveState] = useState(""); // "" | "saving" | "saved"
  const skipNextAutosave = useRef(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    setTask(initialTask || { ...emptyTask, status: defaultStatus });
    skipNextAutosave.current = true;
  }, [initialTask, defaultStatus]);

  function handleChange(field, value) {
    setTask((prev) => ({ ...prev, [field]: value }));
  }

  const isExistingClient = task.status === "既存企業";
  // テレアポ段階ではまだ案件と呼べるものがなく、会社名がそのままタイトルに
  // なる。既存企業も同様に会社名で管理するため、この2ステータスだけ
  // タイトル欄を隠して自動で会社名を使う。
  const usesCompanyNameAsTitle = (status) => status === "既存企業" || status === "テレアポ";
  const hideTitleField = usesCompanyNameAsTitle(task.status);

  function buildPayload(current) {
    return {
      ...current,
      title: usesCompanyNameAsTitle(current.status) ? current.company_name || current.title : current.title,
      start_date: current.start_date || null,
      due_date: current.due_date || null,
      next_follow_up_date: current.next_follow_up_date || null,
      contract_month: current.contract_month || null,
    };
  }

  // Edit mode has no save button — changes are pushed automatically a beat
  // after the person stops typing/selecting, so switching fields or closing
  // the modal never loses anything.
  useEffect(() => {
    if (!isEditMode) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await onSubmit(buildPayload(task));
      setSaveState("saved");
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(buildPayload(task));
  }

  return (
    <div>
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form-header">
        <h2>{isEditMode ? "編集" : isExistingClient ? "既存企業を追加" : "新しい案件を追加"}</h2>
        {isEditMode && (
          <span className={`save-indicator ${saveState}`}>
            {saveState === "saving" ? "保存中…" : saveState === "saved" ? "保存済み" : ""}
          </span>
        )}
      </div>

      {!hideTitleField && (
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
            required={hideTitleField}
          />
        </label>
        <label>
          企業URL
          <input
            type="url"
            value={task.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://example.com"
          />
        </label>
      </div>

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
          onClick={(e) => e.target.showPicker?.()}
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
        {!isEditMode && <button type="submit">保存</button>}
        <button type="button" className="secondary" onClick={onCancel}>
          {isEditMode ? "閉じる" : "キャンセル"}
        </button>
      </div>
    </form>
    {initialTask?.id && <NextActionChecklist taskId={initialTask.id} />}
    {initialTask?.id && isExistingClient && <MeetingMinutes taskId={initialTask.id} />}
    </div>
  );
}
