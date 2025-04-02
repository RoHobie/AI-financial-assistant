import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indian Rupees (₹)
 * @param amount Amount to format
 * @param options Formatting options
 * @returns Formatted currency string with ₹ symbol
 */
export function formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}) {
  const defaultOptions: Intl.NumberFormatOptions = { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2
  };
  
  return `₹${amount.toLocaleString('en-IN', { ...defaultOptions, ...options })}`;
}
