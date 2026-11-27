"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  MAX_WAIT_MS,
  addHold,
  anyHoldActive,
  announceChange,
  clearHoldPending,
  eventIds,
  eventTouches,
  holdPending,
  removeHold,
  subscribeEntityChanged,
  subscribeHolds,
  subscribeLocalMutation,
  subscribeReconnect,
  touchesHold,
} from "@/lib/live-refresh";
import type { ChangeResource, EntityChangedEvent } from "@/types/change-feed";

type MaybeId = string | null | undefined;

export interface LiveRefreshOptions {
  /** Bảng mà màn hình này hiện. Khai báo bằng mảng hằng ở cấp module để tham chiếu ổn định. */
  resources: readonly ChangeResource[];
  /** Màn chi tiết: chỉ nhận sự kiện chạm tới các id này, và mọi sự kiện khớp đều đáng toast. */
  ids?: readonly MaybeId[];
  /** Id đang hiện trên màn danh sách, để quyết định có toast không. */
  visibleIds?: readonly string[];
  enabled?: boolean;
  /** Dồn các sự kiện dồn dập thành một lần tải lại (trailing; tối đa `MAX_WAIT_MS`). */
  debounceMs?: number;
}

function compact(ids: readonly MaybeId[]): string[] {
  return ids.filter((id): id is string => Boolean(id));
}

/** Tải lại dữ liệu nền khi có `entity:changed` chạm tới màn hình; hoãn khi tab ẩn hoặc hộp thoại đang sửa. */
export function useLiveRefresh({
  resources,
  ids,
  visibleIds,
  enabled = true,
  debounceMs = 800,
  onChange,
}: LiveRefreshOptions & { onChange: () => void }): void {
  const refresh = useEffectEvent(onChange);
  const visibleRef = useRef<readonly string[] | undefined>(visibleIds);
  useEffect(() => {
    visibleRef.current = visibleIds;
  });

  const resourceKey = resources.join("|");
  const idKey = ids ? compact(ids).join("|") : null;

  useEffect(() => {
    if (!enabled) return;

    const resourceSet: ReadonlySet<string> = new Set(resourceKey.split("|"));
    const idSet: ReadonlySet<string> | undefined =
      idKey === null ? undefined : new Set(idKey ? idKey.split("|") : []);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let firstAt = 0;
    let deferredBy: EntityChangedEvent | null = null;
    let stale = false;
    let deferredLocal = false;

    const fire = () => {
      timer = null;
      firstAt = 0;
      refresh();
    };
    const schedule = () => {
      const now = Date.now();
      if (firstAt === 0) firstAt = now;
      if (timer) clearTimeout(timer);
      const wait = Math.max(0, Math.min(debounceMs, firstAt + MAX_WAIT_MS - now));
      timer = setTimeout(fire, wait);
    };
    /** Tab ẩn thì chỉ đánh dấu cũ, hiện lại mới tải: không tốn request cho màn không ai nhìn. */
    const refreshOrDefer = () => {
      if (document.hidden) stale = true;
      else schedule();
    };

    const unsubscribeEvents = subscribeEntityChanged((event) => {
      if (!eventTouches(event, resourceSet, idSet)) return;

      const relevant = idSet
        ? true
        : (() => {
            const visible = visibleRef.current;
            if (!visible || visible.length === 0) return false;
            const visibleSet = new Set(visible);
            return eventIds(event).some((id) => visibleSet.has(id));
          })();
      if (relevant) announceChange(event);

      if (touchesHold(event)) {
        deferredBy = event;
        return;
      }
      refreshOrDefer();
    });

    // Ghi do chính tab này: tải lại im lặng, hoãn khi có hold.
    const unsubscribeLocal = subscribeLocalMutation(() => {
      if (anyHoldActive()) {
        deferredLocal = true;
        return;
      }
      refreshOrDefer();
    });

    const unsubscribeHolds = subscribeHolds(() => {
      if (deferredLocal && !anyHoldActive()) {
        deferredLocal = false;
        refreshOrDefer();
      }
      if (!deferredBy || touchesHold(deferredBy)) return;
      deferredBy = null;
      refreshOrDefer();
    });

    const unsubscribeReconnect = subscribeReconnect(refreshOrDefer);

    const onVisible = () => {
      if (document.hidden || !stale) return;
      stale = false;
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribeEvents();
      unsubscribeHolds();
      unsubscribeLocal();
      unsubscribeReconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, resourceKey, idKey, debounceMs]);
}

/** Như `useLiveRefresh` nhưng trả bộ đếm để đưa vào deps của effect tải dữ liệu. */
export function useLiveTick(options: LiveRefreshOptions): number {
  const [tick, setTick] = useState(0);
  useLiveRefresh({ ...options, onChange: () => setTick((value) => value + 1) });
  return tick;
}

/** Hoãn tải lại khi hộp thoại đang sửa `ids`, giữ sự kiện mới nhất để hiện banner; đóng thì tải bù. */
export function useLiveHold(
  active: boolean,
  ids: readonly MaybeId[],
): { pending: EntityChangedEvent | null; clear: () => void } {
  const key = useId();
  const idKey = compact(ids).join("|");

  useEffect(() => {
    if (!active || !idKey) return;
    addHold(key, idKey.split("|"));
    return () => removeHold(key);
  }, [active, idKey, key]);

  const pending = useSyncExternalStore(
    subscribeHolds,
    () => holdPending(key),
    () => null,
  );
  const clear = useCallback(() => clearHoldPending(key), [key]);
  return { pending: active ? pending : null, clear };
}
