import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronDown, Check, AlertCircle, Upload, Clock, AlertTriangle, Star, Loader2 } from 'lucide-react';
import { ComplaintStatus, Priority, getTimeRemaining, isOverdue } from '../../shared/types';

// ─── Button ────────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--accent-700)] text-white hover:bg-[var(--accent-800)] active:bg-[var(--accent-900)]',
    secondary: 'bg-[var(--stone-100)] text-[var(--stone-800)] hover:bg-[var(--stone-200)] border border-[var(--stone-200)]',
    ghost: 'text-[var(--stone-700)] hover:bg-[var(--stone-100)]',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    outline: 'border border-[var(--stone-300)] text-[var(--stone-700)] hover:bg-[var(--stone-50)]',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, hint, icon, className = '', id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--stone-700)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone-400)]">{icon}</div>}
        <input
          id={inputId}
          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors bg-white
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-[var(--stone-300)] focus:border-[var(--accent-600)] focus:ring-[var(--accent-100)]'}
            ${icon ? 'pl-10' : ''}
            focus:outline-none focus:ring-2 ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-700 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--stone-500)]">{hint}</p>
      )}
    </div>
  );
}

// ─── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export function Textarea({ label, error, hint, showCount, maxLength, className = '', id, value, ...props }: TextareaProps) {
  const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`;
  const count = typeof value === 'string' ? value.length : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--stone-700)]">
            {label}
          </label>
        )}
        {showCount && maxLength && (
          <span className={`text-xs ${count > maxLength ? 'text-red-600 font-medium' : 'text-[var(--stone-500)]'}`}>
            {count}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        value={value}
        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors bg-white resize-none
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-[var(--stone-300)] focus:border-[var(--accent-600)] focus:ring-[var(--accent-100)]'}
          focus:outline-none focus:ring-2 ${className}`}
        maxLength={maxLength}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-700 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--stone-500)]">{hint}</p>
      )}
    </div>
  );
}

// ─── Select ────────────────────────────────────────────────────────────────────
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ label, error, hint, options, value, onChange, placeholder, disabled }: SelectProps) {
  const id = `select-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--stone-700)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors bg-white appearance-none pr-10
            ${error ? 'border-red-300' : 'border-[var(--stone-300)]'}
            focus:outline-none focus:ring-2 focus:border-[var(--accent-600)] focus:ring-[var(--accent-100)]
            disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-invalid={!!error}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stone-400)] pointer-events-none" />
      </div>
      {error && (
        <p className="text-sm text-red-700 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-[var(--stone-500)]">{hint}</p>}
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-[var(--accent-600)]' : 'bg-[var(--stone-300)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      {label && <span className="text-sm text-[var(--stone-700)]">{label}</span>}
    </label>
  );
}

// ─── FileDropzone ──────────────────────────────────────────────────────────────
interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  error?: string;
  label?: string;
}

export function FileDropzone({
  files,
  onFilesChange,
  maxFiles = 4,
  maxSizeMB = 5,
  accept = 'image/jpeg,image/png,image/webp',
  error,
  label,
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setLocalError('');
    const arr = Array.from(newFiles);
    const valid = arr.filter(f => {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setLocalError(`${f.name} exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });
    const combined = [...files, ...valid].slice(0, maxFiles);
    onFilesChange(combined);
  };

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-[var(--stone-700)]">{label}</label>}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        tabIndex={0}
        role="button"
        aria-label="Upload files"
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-[var(--accent-500)] bg-[var(--accent-50)]' : 'border-[var(--stone-300)] hover:border-[var(--stone-400)] hover:bg-[var(--stone-50)]'}
          ${(error || localError) ? 'border-red-300' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
        />
        <Upload className="w-8 h-8 mx-auto text-[var(--stone-400)] mb-2" />
        <p className="text-sm text-[var(--stone-600)]">
          <span className="font-medium text-[var(--accent-700)]">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-[var(--stone-500)] mt-1">
          JPEG, PNG, WebP up to {maxSizeMB}MB • Max {maxFiles} files
        </p>
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[var(--stone-200)]">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={e => { e.stopPropagation(); removeFile(idx); }}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(error || localError) && (
        <p className="text-sm text-red-700 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5" />
          {error || localError}
        </p>
      )}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', padding = 'md', hover, onClick }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-8' };
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick(); } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      className={`bg-white rounded-xl border border-[var(--stone-200)] ${paddings[padding]} ${
        hover ? 'hover:shadow-sm hover:border-[var(--stone-300)] transition-all cursor-pointer' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  icon?: React.ReactNode;
}

export function Badge({ children, variant = 'default', icon }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[var(--stone-100)] text-[var(--stone-700)] border-[var(--stone-200)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)] border-green-200',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-yellow-200',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-red-200',
    info: 'bg-[var(--info-bg)] text-[var(--info)] border-blue-200',
    accent: 'bg-[var(--accent-50)] text-[var(--accent-800)] border-[var(--accent-200)]',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${variants[variant]}`}>
      {icon}
      {children}
    </span>
  );
}

// ─── StatusBadge ───────────────────────────────────────────────────────────────
const statusConfig: Record<ComplaintStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'; icon: React.ReactNode }> = {
  [ComplaintStatus.SUBMITTED]: { label: 'Submitted', variant: 'info', icon: <AlertCircle className="w-3 h-3" /> },
  [ComplaintStatus.ACKNOWLEDGED]: { label: 'Acknowledged', variant: 'accent', icon: <Check className="w-3 h-3" /> },
  [ComplaintStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'warning', icon: <Clock className="w-3 h-3" /> },
  [ComplaintStatus.MARKED_RESOLVED]: { label: 'Marked Resolved', variant: 'accent', icon: <Check className="w-3 h-3" /> },
  [ComplaintStatus.RESOLVED]: { label: 'Resolved', variant: 'success', icon: <Check className="w-3 h-3" /> },
  [ComplaintStatus.REOPENED]: { label: 'Reopened', variant: 'danger', icon: <AlertTriangle className="w-3 h-3" /> },
  [ComplaintStatus.CLOSED]: { label: 'Closed', variant: 'default', icon: <Check className="w-3 h-3" /> },
  [ComplaintStatus.REJECTED]: { label: 'Rejected', variant: 'danger', icon: <X className="w-3 h-3" /> },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant} icon={config.icon}>{config.label}</Badge>;
}

// ─── PriorityBadge ─────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === Priority.EMERGENCY) {
    return <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Emergency</Badge>;
  }
  return <Badge variant="default" icon={<Clock className="w-3 h-3" />}>Normal</Badge>;
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <nav className="flex gap-1 border-b border-[var(--stone-200)] overflow-x-auto" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === tab.key
              ? 'border-[var(--accent-600)] text-[var(--accent-800)]'
              : 'border-transparent text-[var(--stone-600)] hover:text-[var(--stone-900)] hover:border-[var(--stone-300)]'
            }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-[var(--accent-100)] text-[var(--accent-800)]' : 'bg-[var(--stone-100)] text-[var(--stone-600)]'
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
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc); };
    }
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--stone-200)]">
          <h2 id="modal-title" className="text-lg font-semibold text-[var(--stone-900)] font-heading">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)] transition" aria-label="Close">
            <X className="w-5 h-5 text-[var(--stone-500)]" />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
  side?: 'left' | 'right';
}

export function Drawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc); };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-full max-w-md bg-white shadow-xl overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--stone-200)]">
          <h2 className="text-lg font-semibold text-[var(--stone-900)] font-heading">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)]" aria-label="Close">
            <X className="w-5 h-5 text-[var(--stone-500)]" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

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
    success: <Check className="w-4 h-4 text-green-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    info: <AlertCircle className="w-4 h-4 text-blue-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
  };

  const bgs: Record<ToastType, string> = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm" aria-live="polite">
      {items.map(toast => (
        <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg ${bgs[toast.type]}`}>
          {icons[toast.type]}
          <p className="text-sm text-[var(--stone-800)]">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[var(--stone-200)] rounded-lg ${className}`} />
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--stone-100)] flex items-center justify-center text-[var(--stone-400)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--stone-800)] font-heading mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--stone-500)] mb-4 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}

// ─── Countdown ─────────────────────────────────────────────────────────────────
interface CountdownProps {
  deadlineAt: string;
  compact?: boolean;
}

export function Countdown({ deadlineAt, compact }: CountdownProps) {
  const overdue = isOverdue({ deadlineAt, status: ComplaintStatus.SUBMITTED } as any);
  const remaining = getTimeRemaining(deadlineAt);

  if (overdue) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${compact ? '' : 'text-red-700'}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className={compact ? 'text-xs' : ''}>Overdue</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${compact ? 'text-[var(--stone-600)]' : 'text-[var(--stone-700)]'}`}>
      <Clock className="w-3.5 h-3.5" />
      <span className={compact ? 'text-xs' : 'font-medium'}>{remaining}</span>
    </span>
  );
}

// ─── StarRating ────────────────────────────────────────────────────────────────
interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function StarRating({ value, onChange, max = 3, size = 'md', readonly }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              star <= (hover || value) ? 'text-amber-400 fill-current' : 'text-[var(--stone-300)]'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
