"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Select } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { AmateurMark } from "@/components/game-ui";
import type { AmateurAffiliation } from "@/lib/amateur";
import { createAffiliationSearch } from "@/lib/amateur-search";

type Choice = { value: string; label: string; icon?: string };

export function CreatorSelect({ label, value, options, onChange }: {
  label: string; value: string; options: readonly Choice[]; onChange: (value: string) => void;
}) {
  const id = useId();
  return <Select.Root value={value} onValueChange={onChange}>
    <Select.Trigger className="creator-picker" aria-labelledby={id} type="button">
      <span className="creator-picker-content">
        <span id={id} className="creator-picker-label">{label}</span>
        <Select.Value />
      </span>
      <Select.Icon asChild><ChevronDown className="creator-picker-chevron" size={18} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content position="popper" sideOffset={7} collisionPadding={12} className="creator-picker-popup creator-select-popup">
        <Select.Viewport className="creator-picker-list">
          {options.map(option => <Select.Item key={option.value} value={option.value} textValue={option.label} className="creator-picker-option">
            <Select.ItemText><span className="creator-picker-choice">{option.icon && <span aria-hidden="true">{option.icon}</span>}{option.label}</span></Select.ItemText>
            <Select.ItemIndicator className="creator-picker-check"><Check size={17} /></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}

const PAGE_SIZE = 60;

export function AffiliationPicker({ label, choices, selected, describedBy, onChange }: {
  label: string; choices: readonly AmateurAffiliation[]; selected?: AmateurAffiliation;
  describedBy?: string; onChange: (id: string) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const search = useMemo(() => createAffiliationSearch(choices), [choices]);
  const matches = useMemo(() => search(query), [search, query]);
  const visible = useMemo(() => matches.slice(0, visibleCount), [matches, visibleCount]);

  return <Combobox.Root<AmateurAffiliation>
    items={choices} filteredItems={visible} value={selected ?? null} required
    itemToStringLabel={entry => entry.name} itemToStringValue={entry => entry.id}
    inputValue={query} onInputValueChange={value => { setQuery(value); setVisibleCount(PAGE_SIZE); }}
    onOpenChange={open => { if (!open) { setQuery(""); setVisibleCount(PAGE_SIZE); } }}
    onValueChange={entry => { if (entry) onChange(entry.id); }}
  >
    <Combobox.Trigger className="creator-picker creator-affiliation-trigger" aria-labelledby={id} aria-describedby={describedBy} type="button">
      {selected ? <AmateurMark id={selected.id} /> : <span className="creator-picker-search-mark" aria-hidden="true"><Search size={18} /></span>}
      <span className="creator-picker-content">
        <span id={id} className="creator-picker-label">{label}</span>
        <span className={selected ? "creator-picker-selected" : "creator-picker-placeholder"}>{selected?.name ?? `${label} 선택`}</span>
      </span>
      <ChevronDown className="creator-picker-chevron" size={18} aria-hidden="true" />
    </Combobox.Trigger>
    <Combobox.Portal>
      <Combobox.Positioner className="creator-picker-positioner" sideOffset={7} collisionPadding={12}>
        <Combobox.Popup className="creator-picker-popup creator-affiliation-popup" initialFocus={type => type === "touch" ? false : input.current}>
          <label className="creator-picker-search">
            <Search size={18} aria-hidden="true" />
            <Combobox.Input ref={input} aria-label={`${label} 검색`} placeholder="한글·원어 이름 또는 지역" />
          </label>
          <div className="creator-picker-count" role="status">{query.trim() ? "검색 결과" : "전체"} {matches.length.toLocaleString("ko-KR")}곳</div>
          <Combobox.Empty className="creator-picker-empty">검색 결과가 없어요. 다른 이름이나 지역으로 검색해 보세요.</Combobox.Empty>
          <Combobox.List className="creator-picker-list">
            {(entry: AmateurAffiliation) => <Combobox.Item key={entry.id} value={entry} className="creator-picker-option creator-affiliation-option">
              <AmateurMark id={entry.id} />
              <span className="creator-picker-content">
                <strong title={entry.nativeName}>{entry.name}</strong>
                <small>{entry.region}</small>
              </span>
              <Combobox.ItemIndicator className="creator-picker-check"><Check size={17} /></Combobox.ItemIndicator>
            </Combobox.Item>}
          </Combobox.List>
          {visible.length < matches.length && <button type="button" className="creator-picker-more" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
            더 보기 <ChevronDown size={15} aria-hidden="true" />
          </button>}
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  </Combobox.Root>;
}
