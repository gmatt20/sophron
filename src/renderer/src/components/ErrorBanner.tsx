interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="w-full max-w-[600px] mx-auto mb-3 flex items-start gap-3 border border-danger/30 bg-danger/5 px-4 py-2.5 text-[13px] text-danger"
    >
      <div className="flex-1 leading-relaxed">{message}</div>
      <button onClick={onDismiss} className="text-[11px] uppercase tracking-widest opacity-80 hover:opacity-100">
        Dismiss
      </button>
    </div>
  );
}
