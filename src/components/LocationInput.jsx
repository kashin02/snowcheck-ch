import { useState, useRef, useEffect } from "react";
import { searchNpa, loadNpaData } from "../hooks/useLocation";

export default function LocationInput({ npa, npaName, setNpa, loading }) {
  const [query, setQuery] = useState(npa ? `${npa} ${npaName}` : "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // Sync display when npa changes externally (e.g. from localStorage)
  useEffect(() => {
    if (npa && npaName && !open) {
      setQuery(`${npa} ${npaName}`);
    }
  }, [npa, npaName, open]);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setFocusIdx(-1);

    if (val.length >= 2) {
      const results = searchNpa(val, 8);
      setSuggestions(results);
      setOpen(true);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }

  function handleSelect(entry) {
    const [code, name] = entry;
    setNpa(code, name);
    setQuery(`${code} ${name}`);
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleClear(e) {
    e.stopPropagation();
    setNpa("", "");
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  // Submit: select focused suggestion, or auto-select first/exact match
  function handleSubmit() {
    if (focusIdx >= 0 && suggestions[focusIdx]) {
      handleSelect(suggestions[focusIdx]);
      return;
    }
    if (suggestions.length > 0) {
      // Prefer exact NPA code match, otherwise pick first result
      const exact = suggestions.find(e => e[0] === query.trim());
      handleSelect(exact || suggestions[0]);
      return;
    }
    // Try a fresh search in case suggestions aren't populated yet
    const results = searchNpa(query.trim(), 1);
    if (results.length > 0) {
      handleSelect(results[0]);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Show the Go button when user has typed something but hasn't selected yet
  const showGoBtn = query.length >= 2 && !npa;

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: "0 0 auto" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        background: npa ? "#EBF8FB" : "#f8fafc",
        border: `1px solid ${npa ? "#A8DDE9" : "#e2e8f0"}`,
        borderRadius: 6, padding: "0 6px",
        transition: "all 0.15s",
      }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>
          {loading ? "\u23F3" : "\uD83D\uDCCD"}
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { loadNpaData(); if (suggestions.length > 0) setOpen(true); }}
          placeholder="NPA ou lieu..."
          style={{
            padding: "5px 2px", fontSize: 12, color: "#334155",
            background: "transparent", border: "none", outline: "none",
            fontFamily: "var(--font-body)", width: 130,
          }}
        />
        {showGoBtn && (
          <span
            onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
            style={{
              cursor: "pointer", fontSize: 10, fontWeight: 700,
              color: "#fff", background: "#42BDD6", borderRadius: 4,
              padding: "2px 7px", lineHeight: "16px", whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            OK
          </span>
        )}
        {npa && (
          <span
            onClick={handleClear}
            style={{ cursor: "pointer", fontSize: 12, color: "#94a3b8", padding: "0 2px", lineHeight: 1 }}
          >
            &times;
          </span>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          marginTop: 2, background: "#fff", borderRadius: 6,
          border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100, maxHeight: 240, overflowY: "auto",
        }}>
          {suggestions.map((entry, i) => (
            <div
              key={entry[0] + entry[1]}
              onClick={() => handleSelect(entry)}
              style={{
                padding: "7px 10px", cursor: "pointer", fontSize: 12,
                background: i === focusIdx ? "#EBF8FB" : "transparent",
                color: "#334155",
                borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
              onMouseEnter={() => setFocusIdx(i)}
            >
              <span style={{ fontWeight: 700, color: "#42BDD6" }}>{entry[0]}</span>
              {" "}{entry[1]}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {open && suggestions.length === 0 && query.length >= 2 && !npa && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          marginTop: 2, background: "#fff", borderRadius: 6,
          border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100, padding: "10px 12px",
        }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Aucun r&eacute;sultat pour &laquo;{query}&raquo;</span>
        </div>
      )}
    </div>
  );
}
