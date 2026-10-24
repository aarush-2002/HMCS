import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle, AlertTriangle, Clock, XCircle, X, Check, Star,
  Upload, ChevronDown, Loader2, ArrowRight, Info, Minus,
} from "lucide-react";
import { ComplaintStatus, Priority, getTimeRemaining, isOverdue } from "../../shared/types";

// ─── Button ────────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "ghost" | "text" | "outline" | "danger" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconRight,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-ember text-ink hover:bg-ember/90 active:bg-ember/80 group",
    ghost: "bg-transparent border border-line text-bone hover:border-ember hover:text-ember active:border-ember/80",
    text: "bg-transparent text-bone-dim hover:text-ember active:text-ember/80",
    outline: "bg-transparent border border-line text-bone hover:border-ember hover:text-ember active:border-ember/80",
    danger: "bg-emergency text-bone hover:bg-emergency/90 active:bg-emergency/80",
    secondary: "bg-line text-bone hover:bg-line/80 active:bg-line/60",
  };
  
  const sizes: Record<ButtonSize, string> = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-6 py-3",
    lg: "text-base px-8 py-4",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon}
          <span className="relative z-10">{children}</span>
          {iconRight}
        </>
      )}
    </button>
  );
}

// ─── NavLink ───────────────────────────────────────────────────────────────────
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  hindi?: string;
  active?: boolean;
}

export function NavLink({ href, children, hindi, active }: NavLinkProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-block text-sm font-medium transition-colors duration-300 ${
        active ? "text-ember" : "text-bone-dim hover:text-bone"
      }`}
    >
      <span className="relative z-10">{children}</span>
      {hindi && (
        <span
          className={`absolute left-0 top-full text-[10px] text-ember/70 devanagari transition-all duration-300 ${
            hovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
          lang="hi"
        >
          {hindi}
        </span>
      )}
      <span
        className={`absolute bottom-0 left-0 right-0 h-px bg-ember transition-transform duration-500 origin-left ${
          hovered || active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </a>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-bone-dim uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 text-sm rounded-lg bg-ink-2 border transition-all duration-300 outline-none
          ${error ? "border-emergency focus:border-emergency" : "border-line focus:border-ember"}
          text-bone placeholder:text-muted ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-emergency">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

// ─── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
  maxLength?: number;
}

export function Textarea({ label, error, showCount, maxLength, className = "", id, value, ...props }: TextareaProps) {
  const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`;
  const count = typeof value === "string" ? value.length : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-bone-dim uppercase tracking-wider">
            {label}
          </label>
        )}
        {showCount && maxLength && (
          <span className={`text-xs tabular ${count > maxLength ? "text-emergency" : "text-muted"}`}>
            {count}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        value={value}
        className={`w-full px-4 py-3 text-sm rounded-lg bg-ink-2 border transition-all duration-300 outline-none resize-none
          ${error ? "border-emergency" : "border-line focus:border-ember"}
          text-bone placeholder:text-muted ${className}`}
        maxLength={maxLength}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-emergency">{error}</p>}
    </div>
  );
}

// ─── Select ────────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Select({ label, options, value, onChange, error }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-bone-dim uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full px-4 py-3 text-sm rounded-lg bg-ink-2 border transition-all duration-300 outline-none appearance-none pr-10
            ${error ? "border-emergency" : "border-line focus:border-ember"}
            text-bone`}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-ink-2">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-emergency">{error}</p>}
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
          checked ? "bg-ember" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-bone rounded-full shadow-sm transition-transform duration-300 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label && <span className="text-sm text-bone-dim">{label}</span>}
    </label>
  );
}

// ─── FileDropzone ──────────────────────────────────────────────────────────────
interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  error?: string;
}

export function FileDropzone({ files, onFilesChange, maxFiles = 4, maxSizeMB = 5, label, error }: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const combined = [...files, ...Array.from(newFiles)].slice(0, maxFiles);
    onFilesChange(combined);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${dragActive ? "border-ember bg-ember-soft" : "border-line hover:border-ember/50"}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto text-muted mb-2" />
        <p className="text-sm text-bone-dim">
          <span className="text-ember font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted mt-1">Up to {maxFiles} files, 5MB each</p>
      </div>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-line">
              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
              <button
                onClick={e => { e.stopPropagation(); onFilesChange(files.filter((_, i) => i !== idx)); }}
                className="absolute inset-0 bg-ink/70 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-4 h-4 text-bone" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", hover, onClick, padding = "md" }: CardProps) {
  const paddings = { none: "", sm: "p-3", md: "p-6", lg: "p-8" };
  return (
    <div
      onClick={onClick}
      className={`bg-ink-2 rounded-xl border border-line ${paddings[padding]} transition-all duration-300 ${
        hover ? "hover:border-ember/30 hover:shadow-lg hover:shadow-ember/5 cursor-pointer" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "ember" | "emergency" | "resolved" | "info" | "danger" | "accent" | "warning" | "success";
  icon?: React.ReactNode;
}

export function Badge({ children, variant = "default", icon }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-line text-bone-dim",
    ember: "bg-ember-soft text-ember border-ember/30",
    emergency: "bg-emergency-soft text-emergency border-emergency/30",
    resolved: "bg-resolved-soft text-resolved border-resolved/30",
    info: "bg-info-soft text-info border-info/30",
    danger: "bg-emergency-soft text-emergency border-emergency/30",
    accent: "bg-ember-soft text-ember border-ember/30",
    warning: "bg-ember-soft text-ember border-ember/30",
    success: "bg-resolved-soft text-resolved border-resolved/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${variants[variant]}`}>
      {icon}
      {children}
    </span>
  );
}

// ─── StatusBadge ───────────────────────────────────────────────────────────────
const statusConfig: Record<ComplaintStatus, { label: string; variant: "default" | "ember" | "emergency" | "resolved" | "info"; icon: React.ReactNode }> = {
  [ComplaintStatus.SUBMITTED]: { label: "Submitted", variant: "info", icon: <Info className="w-3 h-3" /> },
  [ComplaintStatus.ACKNOWLEDGED]: { label: "Acknowledged", variant: "default", icon: <Check className="w-3 h-3" /> },
  [ComplaintStatus.IN_PROGRESS]: { label: "In Progress", variant: "ember", icon: <Clock className="w-3 h-3" /> },
  [ComplaintStatus.MARKED_RESOLVED]: { label: "Marked Resolved", variant: "resolved", icon: <CheckCircle className="w-3 h-3" /> },
  [ComplaintStatus.RESOLVED]: { label: "Resolved", variant: "resolved", icon: <CheckCircle className="w-3 h-3" /> },
  [ComplaintStatus.REOPENED]: { label: "Reopened", variant: "emergency", icon: <AlertTriangle className="w-3 h-3" /> },
  [ComplaintStatus.CLOSED]: { label: "Closed", variant: "default", icon: <Minus className="w-3 h-3" /> },
  [ComplaintStatus.REJECTED]: { label: "Rejected", variant: "default", icon: <X className="w-3 h-3" /> },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant} icon={config.icon}>{config.label}</Badge>;
}

// ─── PriorityBadge ─────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === Priority.EMERGENCY) {
    return <Badge variant="emergency" icon={<AlertTriangle className="w-3 h-3" />}>Emergency</Badge>;
  }
  return <Badge variant="ember" icon={<Clock className="w-3 h-3" />}>Normal</Badge>;
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <nav className="flex gap-1 border-b border-line" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${
            activeTab === tab.key
              ? "border-ember text-ember"
              : "border-transparent text-bone-dim hover:text-bone"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-ember-soft text-ember" : "bg-line text-bone-dim"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", handleEsc);
      return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", handleEsc); };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ink-2 rounded-2xl border border-line shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-lg font-medium text-bone">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-line transition" aria-label="Close">
            <X className="w-5 h-5 text-bone-dim" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Drawer ────────────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-ink-2 border-l border-line shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-lg font-medium text-bone">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-line transition" aria-label="Close">
            <X className="w-5 h-5 text-bone-dim" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

export function showToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, type, message }];
  toastListeners.forEach(fn => fn(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    toastListeners.forEach(fn => fn(toasts));
  }, 4000);
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => { toastListeners = toastListeners.filter(fn => fn !== setItems); };
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-4 h-4 text-resolved" />,
    error: <XCircle className="w-4 h-4 text-emergency" />,
    info: <Info className="w-4 h-4 text-info" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2" aria-live="polite">
      {items.map(toast => (
        <div key={toast.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-ink-2 border border-line shadow-xl">
          {icons[toast.type]}
          <p className="text-sm text-bone">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-ink-3 border border-line text-xs text-bone-dim whitespace-nowrap z-50">
          {content}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-line rounded-lg ${className}`} />;
}

// ─── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-line flex items-center justify-center text-muted">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-bone mb-2">{title}</h3>
      {description && <p className="text-sm text-bone-dim">{description}</p>}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="px-3 py-2 rounded-lg border border-line text-sm text-bone-dim hover:border-ember hover:text-ember disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Previous
      </button>
      <span className="text-sm text-bone-dim tabular">
        {current} / {total}
      </span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="px-3 py-2 rounded-lg border border-line text-sm text-bone-dim hover:border-ember hover:text-ember disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Next
      </button>
    </div>
  );
}

// ─── StarRating ────────────────────────────────────────────────────────────────
interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  max?: number;
}

export function StarRating({ value, onChange, readonly, size = "md", max = 3 }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              star <= (hover || value) ? "text-ember fill-current" : "text-line"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Countdown ─────────────────────────────────────────────────────────────────
interface CountdownProps {
  deadlineAt: string;
  compact?: boolean;
}

export function Countdown({ deadlineAt, compact }: CountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const overdue = new Date(deadlineAt) < new Date(now);
  const remaining = getTimeRemaining(deadlineAt);

  if (overdue) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${compact ? "text-xs" : ""} text-emergency`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Overdue
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm tabular ${compact ? "text-xs" : ""} text-bone-dim`}>
      <Clock className="w-3.5 h-3.5" />
      {remaining}
    </span>
  );
}

// ─── Row (numbered list row) ───────────────────────────────────────────────────
interface RowProps {
  number: number;
  title: string;
  description: string;
  meta?: React.ReactNode;
  onClick?: () => void;
}

export function Row({ number, title, description, meta, onClick }: RowProps) {
  return (
    <div
      onClick={onClick}
      className="group relative flex items-start gap-4 p-4 rounded-xl border border-line hover:border-ember/30 transition-all duration-300 cursor-pointer"
    >
      <div className="text-2xl font-light text-muted tabular w-12 shrink-0">
        {String(number).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-bone group-hover:text-ember transition-colors duration-300 line-clamp-1">
          {title}
        </h3>
        <p className="text-xs text-bone-dim mt-1 line-clamp-2">{description}</p>
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
      <div className="absolute bottom-0 left-16 right-4 h-px bg-gradient-to-r from-ember/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}

// ─── ChapterChip ───────────────────────────────────────────────────────────────
export function ChapterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line text-xs font-medium text-bone-dim uppercase tracking-wider">
      {children}
    </span>
  );
}

// ─── StatBlock ─────────────────────────────────────────────────────────────────
interface StatBlockProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatBlock({ label, value, subtitle }: StatBlockProps) {
  return (
    <div className="text-center">
      <p className="text-3xl font-light text-bone tabular">{value}</p>
      <p className="text-xs text-bone-dim mt-1 uppercase tracking-wider">{label}</p>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── SideRail (dots) ───────────────────────────────────────────────────────────
interface SideRailProps {
  sections: string[];
  activeSection: string;
}

export function SideRail({ sections, activeSection }: SideRailProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map(section => (
        <a
          key={section}
          href={`#${section}`}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            activeSection === section ? "bg-ember scale-125" : "bg-line hover:bg-bone-dim"
          }`}
          aria-label={section}
        />
      ))}
    </div>
  );
}

// ─── CursorRing ────────────────────────────────────────────────────────────────
export function CursorRing() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const handleLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] w-8 h-8 rounded-full border border-ember/30 transition-transform duration-150 ease-out"
      style={{
        left: pos.x - 16,
        top: pos.y - 16,
        transform: "translate(0, 0)",
      }}
      aria-hidden="true"
    />
  );
}
