import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  catalogs,
  legacyDefault,
  type Locale,
  type Messages,
  type MessagesOverride,
} from '../locales/messages';

const MessagesContext = createContext<Messages>(legacyDefault);

export interface LocaleProviderProps {
  /** Built-in catalog to use. Without a provider, components keep their 2.0 strings. */
  locale?: Locale;
  /** Replace individual strings, e.g. `{ dialog: { close: 'Dismiss' } }`. */
  messages?: MessagesOverride;
  children: ReactNode;
}

/** 섹션 단위로 얕게 합친다. 한 섹션의 일부 키만 넘겨도 나머지는 유지된다. */
function mergeMessages(base: Messages, override?: MessagesOverride): Messages {
  if (!override) return base;
  const merged = { ...base } as Record<keyof Messages, unknown>;
  (Object.keys(override) as Array<keyof Messages>).forEach((section) => {
    merged[section] = { ...base[section], ...override[section] };
  });
  return merged as Messages;
}

/**
 * Sets the language of the strings components produce on their own
 * (accessible names, empty states, built-in button labels).
 * Providers can be nested; an inner provider starts from its own `locale`
 * catalog, or from the outer provider's strings when `locale` is omitted.
 */
export function LocaleProvider({ locale, messages, children }: LocaleProviderProps) {
  const inherited = useContext(MessagesContext);
  const value = useMemo(
    () => mergeMessages(locale ? catalogs[locale] : inherited, messages),
    [locale, inherited, messages],
  );
  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

/** The strings in effect for the calling component. */
export function useMessages(): Messages {
  return useContext(MessagesContext);
}
