import { useState } from 'react';
import { Field, fieldSurfaceClassName } from './Field';

export default {
  title: 'Form/Field',
  component: Field,
  tags: ['autodocs'],
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 'var(--tui-control-md)',
  padding: '0 var(--tui-pad-3)',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'var(--tui-ink)',
  font: 'inherit',
};

export const Default = () => (
  <Field label="Bank" helperText="The account salary is paid into">
    {(control) => (
      <div className={fieldSurfaceClassName()}>
        <input {...control} style={inputStyle} placeholder="Type a bank name" />
      </div>
    )}
  </Field>
);

export const Required = () => (
  <Field label="Account holder" required>
    {(control) => (
      <div className={fieldSurfaceClassName()}>
        <input {...control} style={inputStyle} />
      </div>
    )}
  </Field>
);

export const WithError = () => {
  const [value, setValue] = useState('');
  const errorMessage = value.trim() === '' ? 'Enter a bank name' : undefined;
  return (
    <Field label="Bank" helperText="Clear the text to see the error" errorMessage={errorMessage}>
      {(control, meta) => (
        <div className={fieldSurfaceClassName({ error: meta.invalid })}>
          <input
            {...control}
            style={inputStyle}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      )}
    </Field>
  );
};

export const Variants = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Field label="Outlined">
      {(control) => (
        <div className={fieldSurfaceClassName({ variant: 'outlined' })}>
          <input {...control} style={inputStyle} />
        </div>
      )}
    </Field>
    <Field label="Filled">
      {(control) => (
        <div className={fieldSurfaceClassName({ variant: 'filled' })}>
          <input {...control} style={inputStyle} />
        </div>
      )}
    </Field>
  </div>
);

export const HiddenLabel = () => (
  <Field label="Search transactions" hideLabel>
    {(control) => (
      <div className={fieldSurfaceClassName()}>
        <input {...control} style={inputStyle} placeholder="Search transactions" />
      </div>
    )}
  </Field>
);

export const Group = () => (
  <Field label="Statement delivery" group required helperText="You can change this later">
    {({ required: _required, disabled: _disabled, ...control }) => (
      <div role="radiogroup" {...control} style={{ display: 'flex', gap: 16 }}>
        <label>
          <input type="radio" name="delivery" defaultChecked /> Email
        </label>
        <label>
          <input type="radio" name="delivery" /> Post
        </label>
      </div>
    )}
  </Field>
);

export const Disabled = () => (
  <Field label="Bank" disabled>
    {(control) => (
      <div className={fieldSurfaceClassName({ disabled: true })}>
        <input {...control} style={inputStyle} defaultValue="Kookmin" />
      </div>
    )}
  </Field>
);
