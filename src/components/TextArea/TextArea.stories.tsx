import { useState } from 'react';
import { TextArea } from './TextArea';

export default {
  title: 'Form/TextArea',
  component: TextArea,
  tags: ['autodocs'],
};

const column = { display: 'flex', flexDirection: 'column' as const, gap: 16, maxWidth: 420 };

export const Default = () => <TextArea label="Message" placeholder="Write a message" />;

export const Variants = () => (
  <div style={column}>
    <TextArea variant="outlined" label="Outlined" placeholder="Outlined variant" fullWidth />
    <TextArea variant="filled" label="Filled" placeholder="Filled variant" fullWidth />
  </div>
);

export const Sizes = () => (
  <div style={column}>
    <TextArea size="sm" label="Small" placeholder="Small size" fullWidth />
    <TextArea size="md" label="Medium" placeholder="Medium size" fullWidth />
    <TextArea size="lg" label="Large" placeholder="Large size" fullWidth />
  </div>
);

export const AutoResize = () => (
  <div style={column}>
    <TextArea
      label="Grows up to 6 lines"
      helperText="Starts at 2 lines, then scrolls after 6"
      rows={2}
      maxRows={6}
      fullWidth
      defaultValue={'Line one\nLine two\nLine three'}
    />
  </div>
);

export const ManualResize = () => (
  <div style={column}>
    <TextArea
      label="Notes"
      helperText="Drag the corner to resize"
      autoResize={false}
      rows={4}
      fullWidth
    />
  </div>
);

export const CharacterCount = () => {
  const [value, setValue] = useState('Keep it short.');
  return (
    <div style={column}>
      <TextArea
        label="Bio"
        helperText="Shown on your public profile"
        maxLength={80}
        value={value}
        onValueChange={setValue}
        fullWidth
      />
    </div>
  );
};

export const OverLimit = () => (
  <div style={column}>
    <TextArea
      label="Summary"
      maxLength={20}
      defaultValue="This text was loaded from somewhere else and is too long."
      fullWidth
    />
  </div>
);

export const WithError = () => (
  <div style={column}>
    <TextArea label="Reason" required errorMessage="Tell us why you are cancelling" fullWidth />
  </div>
);

export const States = () => (
  <div style={column}>
    <TextArea label="Disabled" defaultValue="Cannot edit" disabled fullWidth />
    <TextArea label="Read only" defaultValue="Can be selected and copied" readOnly fullWidth />
    <TextArea label="Hidden label" hideLabel placeholder="The label is still read by screen readers" fullWidth />
  </div>
);
