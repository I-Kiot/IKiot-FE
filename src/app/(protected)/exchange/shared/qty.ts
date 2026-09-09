import type {
  MovementType,
  StockMovement,
  StockMovementDetail,
} from "@/types/stock-movement";

/** Safe number parsing for spinner/keyboard number inputs. */
export function parseNumberInput(value: string, fallback = 0): number {
  if (value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Receive qty: floor at 0. Doc + BE (after remove-cap): IMPORT/EXPORT/RETURN
 * đều cho phép receivedQuantity khác (kể cả >) quantity.
 */
export function clampReceivedQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

/** @deprecated Doc không còn cap theo loại phiếu - luôn false. */
export function shouldCapReceivedQuantity(_movementType?: MovementType) {
  return false;
}

export function parseReceivedInput(raw: string, fallback = 0) {
  return clampReceivedQuantity(parseNumberInput(raw, fallback));
}

export function buildReceivePayload(
  details: StockMovementDetail[],
  receivedQtys: Record<string, number>,
) {
  return details.map((item) => ({
    productItemId: item.productItemId,
    receivedQuantity: clampReceivedQuantity(
      receivedQtys[item.productItemId] ?? item.quantity,
    ),
  }));
}

/** Chênh lệch tồn sau điều chỉnh = tồn thực tế − tồn hệ thống. */
export function getAdjustQtyChange(snapshot: number, actual: number): number {
  return actual - snapshot;
}

export function sumAdjustQtyChange(
  details: { quantity: number; receivedQuantity: number }[],
): number {
  return details.reduce(
    (sum, d) => sum + getAdjustQtyChange(d.quantity, d.receivedQuantity),
    0,
  );
}

export function formatQtyChange(value: number): string {
  if (value > 0) return `+${value.toLocaleString("vi-VN")}`;
  return value.toLocaleString("vi-VN");
}

export function normalizeOptionalNote(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function hasOrderNote(movement: Pick<StockMovement, "note">) {
  return Boolean(normalizeOptionalNote(movement.note));
}

export function hasLineNotes(movement: Pick<StockMovement, "details">) {
  return movement.details.some((item) =>
    Boolean(normalizeOptionalNote(item.note)),
  );
}

export function hasAnyMovementNote(movement: StockMovement) {
  return hasOrderNote(movement) || hasLineNotes(movement);
}

export function getMovementNotePreview(movement: StockMovement) {
  const orderNote = normalizeOptionalNote(movement.note);
  if (orderNote) return orderNote;
  return movement.details
    .map((item) => normalizeOptionalNote(item.note))
    .find(Boolean);
}
