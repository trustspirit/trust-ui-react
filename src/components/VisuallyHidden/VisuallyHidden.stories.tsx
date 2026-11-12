import { VisuallyHidden } from './VisuallyHidden';

export default {
  title: 'Form/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
};

export const Default = () => (
  <p>
    Balance: 1,200,000
    <VisuallyHidden> Korean won</VisuallyHidden> ₩
  </p>
);

export const IconButtonName = () => (
  <button type="button">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
    <VisuallyHidden>Close</VisuallyHidden>
  </button>
);

export const AsHeading = () => (
  <section>
    <VisuallyHidden as="h2">Recent transactions</VisuallyHidden>
    <ul>
      <li>Coffee — 4,500</li>
      <li>Transit — 1,400</li>
    </ul>
  </section>
);
