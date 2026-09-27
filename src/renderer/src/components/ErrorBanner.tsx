interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="max-w-2xl mx-auto flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200">
      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
      <div className="flex-1 leading-relaxed">{message}</div>
      <button
        onClick={onDismiss}
        className="text-red-300/80 hover:text-red-200 text-xs uppercase tracking-widest"
      >
        Dismiss
      </button>
    </div>
  );
}
