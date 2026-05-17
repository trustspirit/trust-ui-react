/**
 * Ref-counted body scroll lock. Multiple modals/sheets/dialogs may overlap
 * (e.g., a confirmation Dialog opened on top of a BottomSheet). Each caller
 * acquires() on mount and releases() on unmount; only the last release
 * actually restores the document body's previous overflow value.
 */

let lockCount = 0;
let previousOverflow: string | null = null;

export function acquireScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return; // defensive — release without acquire
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? '';
    previousOverflow = null;
  }
}
