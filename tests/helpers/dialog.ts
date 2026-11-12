/**
 * jsdom 은 <dialog> 의 showModal()/close() 를 구현하지 않는다. 열림 상태와
 * close 이벤트만 흉내낸다. top layer·비활성화·포커스 이동은 흉내내지 않는다 —
 * 그건 Playwright 스펙(tests/visual/overlay-focus.spec.ts)이 실제 브라우저로 본다.
 */
export function installDialogPolyfill(): void {
  const proto = window.HTMLDialogElement.prototype as HTMLDialogElement & {
    showModal?: () => void;
    close?: () => void;
  };
  if (typeof proto.showModal === 'function') return;
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
