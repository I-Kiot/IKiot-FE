import type { Socket } from "socket.io-client";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { ENTITY_CHANGED_EVENT, type EntityChangedEvent } from "@/types/change-feed";

/** Lõi tự cập nhật khi người khác đổi dữ liệu: một listener `entity:changed`, cổng toast, hold hộp thoại. */

/** Chờ tối đa bấy lâu kể từ sự kiện đầu của một loạt trước khi tải lại, dù sự kiện cứ dồn tới. */
export const MAX_WAIT_MS = 3000;
/** Thời gian chờ trước khi toast. */
const TOAST_DELAY_MS = 400;
const NOTIFIED_WINDOW_MS = 5000;
const BURST = { windowMs: 3000, threshold: 3 };
const SEEN_TTL_MS = 60_000;

type Listener = (event: EntityChangedEvent) => void;

const listeners = new Set<Listener>();
let attachedTo: Socket | null = null;

function dispatch(event: EntityChangedEvent): void {
  // Ghi "đã có thay đổi" cho hold TRƯỚC khi gọi listener: listener hỏi `touchesHold` để quyết định hoãn.
  recordHoldPending(event);
  listeners.forEach((listener) => listener(event));
}

/** Gắn lại listener khi socket đổi instance. */
function ensureAttached(): void {
  const socket = getSocket();
  if (attachedTo === socket) return;
  attachedTo?.off(ENTITY_CHANGED_EVENT, dispatch);
  socket.on(ENTITY_CHANGED_EVENT, dispatch);
  attachedTo = socket;
}

export function subscribeEntityChanged(listener: Listener): () => void {
  ensureAttached();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// --- Thay đổi do chính tab này ---

const localMutationListeners = new Set<() => void>();

/** Báo mọi màn tải lại sau khi tab này ghi thành công. */
export function notifyLocalMutation(): void {
  localMutationListeners.forEach((listener) => listener());
}

export function subscribeLocalMutation(listener: () => void): () => void {
  localMutationListeners.add(listener);
  return () => {
    localMutationListeners.delete(listener);
  };
}

// --- Kết nối lại ---

const reconnectListeners = new Set<() => void>();
let reconnectAttachedTo: Socket | null = null;
let wasDisconnected = false;

/** Tải lại một lần khi socket nối lại. */
export function subscribeReconnect(listener: () => void): () => void {
  const socket = getSocket();
  if (reconnectAttachedTo !== socket) {
    socket.on("disconnect", () => {
      wasDisconnected = true;
    });
    socket.on("connect", () => {
      if (!wasDisconnected) return;
      wasDisconnected = false;
      reconnectListeners.forEach((fn) => fn());
    });
    reconnectAttachedTo = socket;
  }
  reconnectListeners.add(listener);
  return () => {
    reconnectListeners.delete(listener);
  };
}

// --- Khớp sự kiện ---

/** Sự kiện có chạm tới `resources` (và `ids` nếu có) không. */
export function eventTouches(
  event: EntityChangedEvent,
  resources: ReadonlySet<string>,
  ids?: ReadonlySet<string>,
): boolean {
  for (const change of event.changes) {
    if (!resources.has(change.resource)) continue;
    if (!ids) return true;
    if (change.ids.some((id) => ids.has(id))) return true;
  }
  return false;
}

/** Mọi id của mọi bảng trong sự kiện: dùng để so với id đang hiện trên màn hình. */
export function eventIds(event: EntityChangedEvent): string[] {
  return event.changes.flatMap((change) => change.ids);
}

// --- Hold: hộp thoại đang sửa ---

const holds = new Map<string, ReadonlySet<string>>();
const holdPendingEvents = new Map<string, EntityChangedEvent>();
const holdListeners = new Set<() => void>();

function notifyHolds(): void {
  holdListeners.forEach((listener) => listener());
}

function touchesIds(event: EntityChangedEvent, ids: ReadonlySet<string>): boolean {
  return eventIds(event).some((id) => ids.has(id));
}

function recordHoldPending(event: EntityChangedEvent): void {
  let changed = false;
  for (const [key, ids] of holds) {
    if (!touchesIds(event, ids)) continue;
    holdPendingEvents.set(key, event);
    changed = true;
  }
  if (changed) notifyHolds();
}

export function addHold(key: string, ids: readonly string[]): void {
  ensureAttached();
  holds.set(key, new Set(ids));
}

export function removeHold(key: string): void {
  holds.delete(key);
  holdPendingEvents.delete(key);
  notifyHolds();
}

/** Sự kiện này có chạm tới dữ liệu của một hộp thoại đang mở không. */
export function touchesHold(event: EntityChangedEvent): boolean {
  for (const ids of holds.values()) {
    if (touchesIds(event, ids)) return true;
  }
  return false;
}

/** Có hộp thoại nào đang giữ không (tín hiệu cục bộ không có id nên hoãn khi bất kỳ hold nào còn mở). */
export function anyHoldActive(): boolean {
  return holds.size > 0;
}

export function holdPending(key: string): EntityChangedEvent | null {
  return holdPendingEvents.get(key) ?? null;
}

export function clearHoldPending(key: string): void {
  if (holdPendingEvents.delete(key)) notifyHolds();
}

export function subscribeHolds(listener: () => void): () => void {
  holdListeners.add(listener);
  return () => {
    holdListeners.delete(listener);
  };
}

// --- Cổng toast ---

const seen = new Map<string, number>();
const notified = new Map<string, number>();
let recentToasts: number[] = [];

/** Đánh dấu chứng từ vừa có thông báo. */
export function rememberNotified(referenceId?: string | null): void {
  if (referenceId) notified.set(referenceId, Date.now());
}

function wasNotified(subjectId: string): boolean {
  const at = notified.get(subjectId);
  return at !== undefined && Date.now() - at < NOTIFIED_WINDOW_MS;
}

/** Hiện một toast cho sự kiện; nhiều toast liền nhau thì gộp. */
export function announceChange(event: EntityChangedEvent): void {
  if (event.quiet) return;
  if (typeof document !== "undefined" && document.hidden) return;

  const now = Date.now();
  for (const [id, at] of seen) {
    if (now - at > SEEN_TTL_MS) seen.delete(id);
  }
  if (seen.has(event.eventId)) return;
  seen.set(event.eventId, now);

  window.setTimeout(() => {
    const subjectId = event.subject?.id;
    if (subjectId && wasNotified(subjectId)) return;

    const shownAt = Date.now();
    recentToasts = recentToasts.filter((at) => shownAt - at < BURST.windowMs);
    recentToasts.push(shownAt);
    if (recentToasts.length >= BURST.threshold) {
      toast.info(`Có ${recentToasts.length} cập nhật mới`, { id: "live-burst" });
      return;
    }
    toast.info(event.summary, { id: `live:${event.eventId}` });
  }, TOAST_DELAY_MS);
}
