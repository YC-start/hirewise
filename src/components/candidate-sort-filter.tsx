"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  SortAscending,
  FunnelSimple,
  X,
  CaretDown,
  Check,
} from "@phosphor-icons/react";

/**
 * CandidateSortFilter — Sort dropdown + skill tag filter bar for the pipeline (C-5).
 *
 * - Sort dropdown: Overall Score (default), Technical Fit, Culture Fit, Experience Depth
 * - Skill filter: click a skill chip to filter candidates; click again or clear to restore
 *
 * Design: Industrial Clarity — monospace labels, flat controls, accent-primary active states.
 */

export type SortDimension =
  | "matchScore"
  | "technicalFit"
  | "cultureFit"
  | "experienceDepth";

export const SORT_OPTIONS: { value: SortDimension; label: string }[] = [
  { value: "matchScore", label: "Overall Score" },
  { value: "technicalFit", label: "Technical Fit" },
  { value: "cultureFit", label: "Culture Fit" },
  { value: "experienceDepth", label: "Experience Depth" },
];

interface CandidateSortFilterProps {
  sortBy: SortDimension;
  onSortChange: (dimension: SortDimension) => void;
  skillFilter: string | null;
  onSkillFilterChange: (skill: string | null) => void;
  availableSkills: string[];
}

export function CandidateSortFilter({
  sortBy,
  onSortChange,
  skillFilter,
  onSkillFilterChange,
  availableSkills,
}: CandidateSortFilterProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const sortRef = useRef<HTMLDivElement>(null);
  const skillRef = useRef<HTMLDivElement>(null);
  const skillSearchRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (skillRef.current && !skillRef.current.contains(e.target as Node)) {
        setSkillDropdownOpen(false);
        setSkillSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when skill dropdown opens
  useEffect(() => {
    if (skillDropdownOpen && skillSearchRef.current) {
      skillSearchRef.current.focus();
    }
  }, [skillDropdownOpen]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Overall Score";

  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return availableSkills;
    const q = skillSearch.toLowerCase();
    return availableSkills.filter((s) => s.toLowerCase().includes(q));
  }, [availableSkills, skillSearch]);

  const handleSortSelect = useCallback(
    (dimension: SortDimension) => {
      onSortChange(dimension);
      setSortOpen(false);
    },
    [onSortChange]
  );

  const handleSkillSelect = useCallback(
    (skill: string) => {
      onSkillFilterChange(skill);
      setSkillDropdownOpen(false);
      setSkillSearch("");
    },
    [onSkillFilterChange]
  );

  const handleClearFilter = useCallback(() => {
    onSkillFilterChange(null);
  }, [onSkillFilterChange]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-b border-border-default bg-surface-primary flex-shrink-0"
      data-testid="sort-filter-bar"
    >
      {/* Sort dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          onClick={() => setSortOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium border transition-colors ${
            sortBy !== "matchScore"
              ? "border-accent-primary/60 text-accent-primary bg-accent-primary/8"
              : "border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted"
          }`}
          data-testid="sort-dropdown-trigger"
          aria-haspopup="listbox"
          aria-expanded={sortOpen}
        >
          <SortAscending size={13} weight="bold" />
          <span>{currentSortLabel}</span>
          <CaretDown
            size={10}
            weight="bold"
            className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
          />
        </button>

        {sortOpen && (
          <div
            className="absolute top-full left-0 mt-1 min-w-[180px] border border-border-default bg-surface-secondary shadow-lg z-50"
            data-testid="sort-dropdown-menu"
            role="listbox"
            aria-label="Sort by dimension"
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortSelect(option.value)}
                className={`flex items-center justify-between w-full px-3 py-2 text-[11px] font-mono font-medium transition-colors ${
                  sortBy === option.value
                    ? "text-accent-primary bg-accent-primary/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/50"
                }`}
                role="option"
                aria-selected={sortBy === option.value}
                data-testid={`sort-option-${option.value}`}
              >
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <Check size={12} weight="bold" className="text-accent-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skill filter dropdown */}
      <div className="relative" ref={skillRef}>
        <button
          onClick={() => setSkillDropdownOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium border transition-colors ${
            skillFilter
              ? "border-accent-primary/60 text-accent-primary bg-accent-primary/8"
              : "border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted"
          }`}
          data-testid="skill-filter-trigger"
          aria-haspopup="listbox"
          aria-expanded={skillDropdownOpen}
        >
          <FunnelSimple size={13} weight="bold" />
          <span>{skillFilter || "Filter by Skill"}</span>
          <CaretDown
            size={10}
            weight="bold"
            className={`transition-transform ${skillDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {skillDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1 min-w-[220px] max-h-[280px] border border-border-default bg-surface-secondary shadow-lg z-50 flex flex-col"
            data-testid="skill-filter-menu"
            role="listbox"
            aria-label="Filter by skill"
          >
            {/* Search input */}
            <div className="p-2 border-b border-border-default flex-shrink-0">
              <input
                ref={skillSearchRef}
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full px-2 py-1 text-[11px] font-mono bg-surface-primary border border-border-default text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary/50"
                data-testid="skill-search-input"
              />
            </div>

            {/* Skill list */}
            <div className="overflow-y-auto flex-1">
              {filteredSkills.length === 0 ? (
                <div className="px-3 py-3 text-[11px] font-mono text-text-muted text-center">
                  No skills found
                </div>
              ) : (
                filteredSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSkillSelect(skill)}
                    className={`flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-mono font-medium transition-colors ${
                      skillFilter === skill
                        ? "text-accent-primary bg-accent-primary/10"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/50"
                    }`}
                    role="option"
                    aria-selected={skillFilter === skill}
                    data-testid={`skill-option-${skill.toLowerCase().replace(/[\s/()]+/g, "-")}`}
                  >
                    <span>{skill}</span>
                    {skillFilter === skill && (
                      <Check size={12} weight="bold" className="text-accent-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active filter chip (shown when skill filter is active) */}
      {skillFilter && (
        <button
          onClick={handleClearFilter}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-accent-primary border border-accent-primary/40 bg-accent-primary/8 hover:bg-accent-primary/15 transition-colors"
          data-testid="clear-skill-filter"
          aria-label={`Clear filter: ${skillFilter}`}
        >
          <span>{skillFilter}</span>
          <X size={10} weight="bold" />
        </button>
      )}

      {/* Active sort indicator (shown when non-default sort) */}
      {sortBy !== "matchScore" && (
        <button
          onClick={() => onSortChange("matchScore")}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-text-secondary border border-border-default hover:text-text-primary hover:border-text-muted transition-colors"
          data-testid="reset-sort"
          aria-label="Reset sort to Overall Score"
        >
          <span>Reset sort</span>
          <X size={10} weight="bold" />
        </button>
      )}
    </div>
  );
}
