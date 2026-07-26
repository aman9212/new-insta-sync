import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        {variant === "danger" && (
          <div className="p-2 rounded-full bg-danger-subtle text-danger shrink-0 mt-0.5">
            <Icon name="alert-triangle" size={20} />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}