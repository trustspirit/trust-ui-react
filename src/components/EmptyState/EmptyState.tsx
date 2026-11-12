import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Heading that says what is missing */
  title: string;
  /** Supporting text: why the area is empty and what to do next */
  description?: ReactNode;
  /** Decorative illustration or icon above the title; hidden from assistive technology */
  icon?: ReactNode;
  /** Buttons or links below the text */
  actions?: ReactNode;
  /**
   * Heading level of the title. Changes the tag only, not the appearance —
   * pick the level that fits the surrounding document outline.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Tighter spacing for cards and panels; actions stack vertically and stretch */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { title, description, icon, actions, headingLevel = 3, compact = false, className, style, ...rest },
    ref,
  ) => {
    const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    const classNames = [styles.emptyState, compact ? styles.compact : '', className ?? '']
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} style={style} {...rest}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <div className={styles.text}>
          <Heading className={styles.title}>{title}</Heading>
          {description && <div className={styles.description}>{description}</div>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';
