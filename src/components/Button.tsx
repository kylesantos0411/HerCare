import React, { type ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  fullWidth = false,
  ...props 
}) => {
  return (
    <button 
      className={classNames('hercare-btn', `btn-${variant}`, { 'btn-full': fullWidth }, className)}
      {...props}
    >
      {children}
    </button>
  );
};
