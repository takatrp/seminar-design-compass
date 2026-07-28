import { useEffect, useRef, useState } from "react";
import type { Attachment, Segment, SegmentType, SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  segment: Segment;
  onChange: (segment: Segment) => void;
  onAppendAttachments: (attachments: Attachment[]) => void;
  onClose: () => void;
  onMakeId: (prefix: string) => string;
  onNotice: (message: string) => void;
  autoSaveFailed: boolean;
}

export const segmentTypeOptions: { value: SegmentType; label: string }[] = [
  { value: "opening", label: "導入" },
  { value: "context", label: "背景整理" },
  { value: "lecture", label: "講義" },
  { value: "dialogue", label: "対話" },
  { value: "demo", label: "デモ" },
  { value: "case", label: "事例" },
  { value: "discussion", label: "ディスカッション" },
  { value: "work", label: "ワーク" },
  { value: "qa", label: "質疑応答" },
  { value: "summary", label: "まとめ" },
  { value: "closing", label: "クロージング" }
];

export function getSegmentTypeLabel(type: SegmentType): string {
  return segmentTypeOptions.find((option) => option.value === type)?.label ?? type;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function optimizeImage(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  if (file.type === "image/svg+xml" || file.size <= 650_000) return original;

  const image = await loadImage(original);
  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d");
  if (!context) return original;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.82);
}

export function SegmentEditor({
  plan,
  segment,
  onChange,
  onAppendAttachments,
  onClose,
  onMakeId,
  onNotice,
  autoSaveFailed
}: Props) {
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const siblings = Array.from(
      backdropRef.current?.parentElement?.children ?? []
    ).filter((element) => element !== backdropRef.current);
    const previousInert = siblings.map((element) => element.hasAttribute("inert"));
    siblings.forEach((element) => element.setAttribute("inert", ""));
    titleInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        modalRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      siblings.forEach((element, index) => {
        if (!previousInert[index]) element.removeAttribute("inert");
      });
      previousFocus?.focus();
    };
  }, [onClose]);

  const updateAttachments = (attachments: Attachment[]) => {
    onChange({ ...segment, attachments });
  };

  const addLink = () => {
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) {
      onNotice("参考URLを入力してください。");
      return;
    }
    const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl.replace(/^[a-z][a-z0-9+.-]*:/i, "")}`;
    onAppendAttachments([
      {
        id: onMakeId("attachment"),
        type: "url",
        label: linkLabel.trim() || normalizedUrl,
        url: normalizedUrl
      }
    ]);
    setLinkLabel("");
    setLinkUrl("");
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      onNotice("画像ファイルを選択してください。");
      return;
    }
    try {
      const added: Attachment[] = await Promise.all(
        imageFiles.map(async (file) => ({
          id: onMakeId("attachment"),
          type: "image" as const,
          fileName: file.name,
          dataUrl: await optimizeImage(file),
          alt: file.name.replace(/\.[^.]+$/, "")
        }))
      );
      onAppendAttachments(added);
      onNotice(`${added.length}件の画像を追加しました。画像はJSON内に保存されます。`);
    } catch {
      onNotice("画像を読み込めませんでした。別の画像でお試しください。");
    }
  };

  const removeAttachment = (attachmentId: string) => {
    updateAttachments(segment.attachments.filter((attachment) => attachment.id !== attachmentId));
  };

  return (
    <div ref={backdropRef} className="modalBackdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section
        ref={modalRef}
        className="segmentEditorModal"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="segment-editor-title"
      >
        <div className="modalHeader">
          <div>
            <p className="sectionKicker">CARD EDITOR</p>
            <h2 id="segment-editor-title">カードを編集</h2>
          </div>
          <button type="button" className="closeButton" onClick={onClose} aria-label="編集画面を閉じる">
            ×
          </button>
        </div>

        <div className="modalBody">
          <section className="editorSection">
            <h3>基本設定</h3>
            <label>
              タイトル
              <input
                ref={titleInputRef}
                value={segment.title}
                onChange={(event) => onChange({ ...segment, title: event.target.value })}
              />
            </label>
            <div className="fieldGrid threeColumns">
              <label>
                所要時間（分）
                <input
                  type="number"
                  min={1}
                  value={segment.durationMin}
                  onChange={(event) =>
                    onChange({ ...segment, durationMin: Math.max(1, Number(event.target.value) || 1) })
                  }
                />
              </label>
              <label>
                柱
                <select
                  value={segment.pillarId}
                  onChange={(event) => onChange({ ...segment, pillarId: event.target.value })}
                >
                  {plan.pillars.map((pillar) => (
                    <option key={pillar.id} value={pillar.id}>
                      {pillar.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                区分
                <select
                  value={segment.type}
                  onChange={(event) =>
                    onChange({ ...segment, type: event.target.value as SegmentType })
                  }
                >
                  {segmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="editorSection">
            <h3>話す内容</h3>
            <label>
              このカードの狙い
              <textarea
                rows={3}
                value={segment.goal}
                placeholder="この時間で参加者に何を理解してもらうか"
                onChange={(event) => onChange({ ...segment, goal: event.target.value })}
              />
            </label>
            <label>
              台本・話すポイント
              <textarea
                rows={8}
                value={segment.script}
                placeholder="実際に話す流れ、具体例、補足など"
                onChange={(event) => onChange({ ...segment, script: event.target.value })}
              />
            </label>
            <div className="fieldGrid">
              <label>
                参加者への問い
                <textarea
                  rows={3}
                  value={segment.question}
                  placeholder="参加者に投げかける問い"
                  onChange={(event) => onChange({ ...segment, question: event.target.value })}
                />
              </label>
              <label>
                次へのつなぎ
                <textarea
                  rows={3}
                  value={segment.transition}
                  placeholder="次のカードへどう接続するか"
                  onChange={(event) => onChange({ ...segment, transition: event.target.value })}
                />
              </label>
            </div>
            <label>
              持ち帰ってほしいこと
              <textarea
                rows={3}
                value={segment.takeaway}
                placeholder="このカードの着地点"
                onChange={(event) => onChange({ ...segment, takeaway: event.target.value })}
              />
            </label>
            <label>
              講師用メモ
              <textarea
                rows={4}
                value={segment.notes}
                placeholder="準備物、注意点、当日の補足"
                onChange={(event) => onChange({ ...segment, notes: event.target.value })}
              />
            </label>
          </section>

          <section className="editorSection">
            <div className="editorSectionHeader">
              <div>
                <h3>画像・参考URL</h3>
                <p className="mutedText">
                  画像は端末内で縮小し、JSONに埋め込んで保存します。外部送信はしません。
                </p>
              </div>
              <label className="fileButton">
                ＋ 画像を追加
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    void addImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="linkComposer">
              <label>
                表示名
                <input
                  value={linkLabel}
                  placeholder="例：参考記事"
                  onChange={(event) => setLinkLabel(event.target.value)}
                />
              </label>
              <label>
                参考URL
                <input
                  type="url"
                  value={linkUrl}
                  placeholder="https://example.com/"
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addLink();
                    }
                  }}
                />
              </label>
              <button type="button" className="primaryButton" onClick={addLink}>
                URLを追加
              </button>
            </div>

            {segment.attachments.length === 0 ? (
              <div className="emptyState smallEmpty">
                <strong>添付はまだありません</strong>
                <span>候補スライドや参考記事をカード単位でまとめられます。</span>
              </div>
            ) : (
              <div className="attachmentGrid">
                {segment.attachments.map((attachment) =>
                  attachment.type === "image" ? (
                    <article className="attachmentCard imageAttachment" key={attachment.id}>
                      <button
                        type="button"
                        className="imagePreviewButton"
                        onClick={() => window.open(attachment.dataUrl, "_blank", "noopener,noreferrer")}
                        title="画像を拡大"
                      >
                        <img src={attachment.dataUrl} alt={attachment.alt || attachment.fileName} />
                      </button>
                      <label>
                        画像の説明
                        <input
                          value={attachment.alt ?? ""}
                          onChange={(event) =>
                            updateAttachments(
                              segment.attachments.map((item) =>
                                item.id === attachment.id && item.type === "image"
                                  ? { ...item, alt: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                      </label>
                      <div className="attachmentFooter">
                        <span title={attachment.fileName}>{attachment.fileName}</span>
                        <button
                          type="button"
                          className="dangerButton"
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          削除
                        </button>
                      </div>
                    </article>
                  ) : (
                    <article className="attachmentCard urlAttachment" key={attachment.id}>
                      <div className="urlIcon" aria-hidden="true">↗</div>
                      <label>
                        表示名
                        <input
                          value={attachment.label}
                          onChange={(event) =>
                            updateAttachments(
                              segment.attachments.map((item) =>
                                item.id === attachment.id && item.type === "url"
                                  ? { ...item, label: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                      </label>
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        {attachment.url}
                      </a>
                      <button
                        type="button"
                        className="dangerButton alignSelfEnd"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        削除
                      </button>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        <div className="modalFooter">
          <span className={autoSaveFailed ? "saveErrorText" : ""}>
            {autoSaveFailed
              ? "自動保存できていません。JSON保存でデータを残してください。"
              : "変更内容は自動保存されます。"}
          </span>
          <button type="button" className="primaryButton" onClick={onClose}>
            編集を完了
          </button>
        </div>
      </section>
    </div>
  );
}
