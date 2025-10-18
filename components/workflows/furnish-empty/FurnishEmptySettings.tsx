// components/workflows/furnish-empty/FurnishEmptySettings.tsx
"use client";

import { FurnishEmptySettingsType, Material } from "@/types/workflows/furnishEmptySettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { SettingsSlider } from "@/components/ui/SettingsSlider";
import {
  SPACE_TYPES,
  FURNISHING_STYLES,
  COLOR_SCHEMES,
  FURNITURE_DENSITIES,
  LIGHTINGS,
  TARGET_AUDIENCES,
  MATERIALS,
  getSpaceTypeIcon,
  SETTING_ICONS,
} from "@/constants/furnishEmptySettings";
import { STRUCTURE_FIDELITY_TOOLTIPS } from "@/constants/workflowSettings";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface FurnishEmptySettingsProps {
  settings: FurnishEmptySettingsType;
  onSettingsChange: (settings: FurnishEmptySettingsType) => void;
}

export function FurnishEmptySettings({ settings, onSettingsChange }: FurnishEmptySettingsProps) {
  const updateSetting = <K extends keyof FurnishEmptySettingsType>(
    key: K,
    value: FurnishEmptySettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Materials multi-select state
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const materialsRef = useRef<HTMLDivElement>(null);

  // Close materials dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (materialsOpen && materialsRef.current && !materialsRef.current.contains(e.target as Node)) {
        setMaterialsOpen(false);
      }
    };

    if (materialsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [materialsOpen]);

  const toggleMaterial = (material: Material) => {
    const newMaterials = settings.materials.includes(material)
      ? settings.materials.filter(m => m !== material)
      : [...settings.materials, material];
    updateSetting("materials", newMaterials);
  };

  const getMaterialsLabel = () => {
    if (settings.materials.length === 0) return "Materialien";
    if (settings.materials.length === 1) {
      const mat = MATERIALS.find(m => m.value === settings.materials[0]);
      return mat?.label || "1 Material";
    }
    return `${settings.materials.length} Materialien`;
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Space Type */}
      <SettingsDropdown
        icon={getSpaceTypeIcon(settings.spaceType)}
        options={SPACE_TYPES}
        value={settings.spaceType}
        onChange={(v) => updateSetting("spaceType", v as any)}
        placeholder="Raumtyp"
        scrollable={true}
      />

      {/* Furnishing Style */}
      <SettingsDropdown
        icon={SETTING_ICONS.furnishingStyle}
        options={FURNISHING_STYLES}
        value={settings.furnishingStyle}
        onChange={(v) => updateSetting("furnishingStyle", v as any)}
        placeholder="Einrichtungsstil"
        scrollable={true}
      />

      {/* Color Scheme */}
      <SettingsDropdown
        icon={SETTING_ICONS.colorScheme}
        options={COLOR_SCHEMES}
        value={settings.colorScheme}
        onChange={(v) => updateSetting("colorScheme", v as any)}
        placeholder="Farbschema"
        scrollable={true}
      />

      {/* Materials (Multi-select) */}
      <div className="relative" ref={materialsRef}>
        <button
          onClick={() => setMaterialsOpen(!materialsOpen)}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            materialsOpen ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <SETTING_ICONS.materials
            className={`w-3 h-3 transition-colors ${
              materialsOpen ? "text-pw-accent" : "text-pw-black/40"
            }`}
          />
          <span className="text-[10px] font-medium text-pw-black/70">
            {getMaterialsLabel()}
          </span>
          <ChevronDown
            className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${
              materialsOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {materialsOpen && (
          <div className="absolute bottom-full mb-2 left-0 min-w-[11rem] max-w-[16rem] bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pw-black/20 scrollbar-track-transparent">
              {MATERIALS.map((material) => {
                const isSelected = settings.materials.includes(material.value as Material);
                return (
                  <button
                    key={material.value}
                    onClick={() => toggleMaterial(material.value as Material)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                      isSelected
                        ? "bg-pw-accent/10 text-pw-accent font-medium"
                        : "text-pw-black/70 hover:bg-pw-black/5"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? "bg-pw-accent border-pw-accent" : "border-pw-black/20"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {material.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Furniture Density */}
      <SettingsDropdown
        icon={SETTING_ICONS.furnitureDensity}
        options={FURNITURE_DENSITIES}
        value={settings.furnitureDensity}
        onChange={(v) => updateSetting("furnitureDensity", v as any)}
        placeholder="Möbeldichte"
        scrollable={true}
      />

      {/* Lighting */}
      <SettingsDropdown
        icon={SETTING_ICONS.lighting}
        options={LIGHTINGS}
        value={settings.lighting}
        onChange={(v) => updateSetting("lighting", v as any)}
        placeholder="Beleuchtung"
        scrollable={true}
      />

      {/* Target Audience */}
      <SettingsDropdown
        icon={SETTING_ICONS.targetAudience}
        options={TARGET_AUDIENCES}
        value={settings.targetAudience}
        onChange={(v) => updateSetting("targetAudience", v as any)}
        placeholder="Zielgruppe"
        scrollable={true}
        align="right"
      />

      {/* Structure Adherence Slider */}
      <SettingsSlider
        icon={SETTING_ICONS.structureAdherence}
        label="Struktur"
        value={settings.structureAdherence ?? 100}
        onChange={(v) => updateSetting("structureAdherence", v)}
        variant="inline"
        tooltips={STRUCTURE_FIDELITY_TOOLTIPS}
        min={10}
        max={100}
        step={10}
        unit="%"
      />
    </div>
  );
}
