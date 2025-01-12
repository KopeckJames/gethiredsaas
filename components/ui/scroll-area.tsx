import React from 'react';

const ScrollArea: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  return (
    <div className={className} style={{ overflowY: 'auto', maxHeight: '400px' }}>
      {children}
    </div>
  );
};

export default ScrollArea;
