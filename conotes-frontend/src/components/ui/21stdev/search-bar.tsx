'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExpandableSearchBarProps = {
  expandDirection?: 'left' | 'right';
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (query: string) => void;
  className?: string;
  defaultOpen?: boolean;
  width?: number;
  value?: string;
};

const COLLAPSED_SIZE = 40;

export default function ExpandableSearchBar({
  expandDirection = 'right',
  placeholder = 'Search...',
  onSearch,
  onChange,
  className = '',
  defaultOpen = false,
  width = 280,
  value: controlledValue,
}: ExpandableSearchBarProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [value, setValue] = useState(controlledValue ?? '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // sync controlled value
  useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue);
  }, [controlledValue]);

  // close on outside click (only if empty)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node) && open && value === '') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, value]);

  // focus input when opening
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(id);
    } else {
      if (controlledValue === undefined) setValue('');
    }
  }, [open, controlledValue]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) { setOpen(false); setValue(''); onChange?.(''); }
      if (e.key === 'Enter' && open && value.trim()) onSearch?.(value);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, value, onSearch, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value);
  };

  return (
    <div
      ref={containerRef}
      className={cn('search-bar-root', className)}
      style={{ width: COLLAPSED_SIZE, height: COLLAPSED_SIZE }}
    >
      {/* Toggle button — always visible */}
      <button
        type="button"
        aria-label={open ? 'Close search' : 'Open search'}
        onClick={() => setOpen((s) => !s)}
        className="search-bar-toggle"
      >
        {open ? <X size={16} /> : <Search size={16} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className={cn('search-bar-form', expandDirection === 'left' ? 'search-bar-left' : 'search-bar-right')}
            initial={{ width: COLLAPSED_SIZE, opacity: 0.98 }}
            animate={{ width, opacity: 1 }}
            exit={{ width: COLLAPSED_SIZE, opacity: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            {expandDirection === 'right' && (
              <span className="search-bar-icon-left" aria-hidden>
                <Search size={15} />
              </span>
            )}

            <div className="search-bar-input-wrap">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                className={cn('search-bar-input', expandDirection === 'left' ? 'search-bar-input-left' : 'search-bar-input-right')}
                aria-label={placeholder}
              />
              <AnimatePresence>
                {open && !value && (
                  <motion.span
                    key="ph"
                    className={cn('search-bar-placeholder', expandDirection === 'left' ? 'search-bar-placeholder-left' : 'search-bar-placeholder-right')}
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 0.6, x: 0 }}
                    exit={{ opacity: 0, x: expandDirection === 'left' ? -8 : 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {placeholder}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {expandDirection === 'left' && (
              <span className="search-bar-icon-right" aria-hidden>
                <Search size={15} />
              </span>
            )}

            <AnimatePresence initial={false}>
              {open && expandDirection === 'right' && (
                <motion.button
                  key="go"
                  type="submit"
                  className="search-bar-submit"
                  aria-label="Search"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  <Search size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
