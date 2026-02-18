"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

interface AddressAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  placeholder = "Area, address, or landmark for delivery",
  className,
  disabled,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<{ text: string; placeId?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID?.() ?? `session-${Date.now()}`);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, sessionToken }),
      });
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data.suggestions) ? data.suggestions : [];
      setSuggestions(list);
      setOpen(list.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchSuggestions(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (text: string) => {
    onChange(text);
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative space-y-1">
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        role="combobox"
      />
      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg py-1"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId ?? `${s.text}-${i}`}
              role="option"
              aria-selected={false}
              className="px-3 py-2 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--muted-bg)] focus:bg-[var(--muted-bg)] outline-none"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s.text);
              }}
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <p className="text-xs text-[var(--muted)]">Loading suggestions…</p>
      )}
    </div>
  );
}
