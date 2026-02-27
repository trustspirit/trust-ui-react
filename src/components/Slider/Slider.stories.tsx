import { useState } from 'react';
import { Slider } from './Slider';

export default {
  title: 'Form/Slider',
  component: Slider,
};

export const Default = () => {
  const [value, setValue] = useState(50);
  return <Slider value={value} onChange={setValue} />;
};

export const WithValue = () => {
  const [value, setValue] = useState(50);
  return <Slider value={value} onChange={setValue} showValue />;
};

export const CustomRange = () => {
  const [value, setValue] = useState(25);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Slider value={value} onChange={setValue} min={0} max={50} showValue />
      <p style={{ fontSize: 14, color: '#666' }}>Range: 0-50, Value: {value}</p>
    </div>
  );
};

export const Steps = () => {
  const [value, setValue] = useState(50);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Slider value={value} onChange={setValue} step={10} showValue />
      <p style={{ fontSize: 14, color: '#666' }}>Step: 10</p>
    </div>
  );
};

export const Sizes = () => {
  const [sm, setSm] = useState(30);
  const [md, setMd] = useState(50);
  const [lg, setLg] = useState(70);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Small</p>
        <Slider size="sm" value={sm} onChange={setSm} showValue />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Medium</p>
        <Slider size="md" value={md} onChange={setMd} showValue />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Large</p>
        <Slider size="lg" value={lg} onChange={setLg} showValue />
      </div>
    </div>
  );
};

export const Variants = () => {
  const [primary, setPrimary] = useState(60);
  const [secondary, setSecondary] = useState(40);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Primary</p>
        <Slider variant="primary" value={primary} onChange={setPrimary} showValue />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Secondary</p>
        <Slider variant="secondary" value={secondary} onChange={setSecondary} showValue />
      </div>
    </div>
  );
};

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Slider value={30} disabled showValue />
    <Slider value={70} disabled showValue variant="secondary" />
  </div>
);

export const Uncontrolled = () => (
  <Slider defaultValue={25} showValue />
);

export const Volume = () => {
  const [volume, setVolume] = useState(75);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 14, color: '#666', minWidth: 60 }}>Volume</span>
      <Slider value={volume} onChange={setVolume} showValue />
    </div>
  );
};
