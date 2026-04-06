import React from 'react';

export const Placeholder: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
      <h2>{title}</h2>
      <p>Coming Soon</p>
    </div>
  );
};
