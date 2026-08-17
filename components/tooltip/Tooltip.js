import React from 'react';
export const Tooltip = ({ title, children }) => {
    return React.createElement('div', { title }, children);
};
