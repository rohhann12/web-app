import { useState, useCallback } from 'react';
import { LanguagesIcon } from 'lucide-react';
import { useMap } from 'react-map-gl/maplibre';
import { ControlButton, CustomControl } from './custom-control';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const MAP_LANGUAGE_STORAGE_KEY = 'map_label_language';

// Shortbread OSM vector tiles only provide name, name_en, and name_de
const mapLanguageOptions = [
  { key: 'default', text: 'Local (Default)', value: 'default' },
  { key: 'en', text: 'English', value: 'en' },
  { key: 'de', text: 'German', value: 'de' },
];

function getInitialMapLanguage(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(MAP_LANGUAGE_STORAGE_KEY) ?? 'default';
}

export function updateMapLabels(
  map: maplibregl.Map | undefined,
  language: string
) {
  if (!map) return;

  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;

    const textField = (layer.layout as Record<string, unknown>)?.['text-field'];
    if (typeof textField !== 'string') continue;

    // Only update layers that use {name}, {name_en}, or {name_de}
    if (!textField.match(/\{name(_[a-z]{2})?\}/)) continue;

    const newTextField =
      language === 'default' ? '{name}' : `{name_${language}}`;

    map.setLayoutProperty(layer.id, 'text-field', newTextField);
  }
}

export const MapLanguageControl = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(
    getInitialMapLanguage
  );
  const [open, setOpen] = useState(false);
  const { current: map } = useMap();

  const handleLanguageChange = useCallback(
    (langCode: string) => {
      setSelectedLanguage(langCode);
      localStorage.setItem(MAP_LANGUAGE_STORAGE_KEY, langCode);
      setOpen(false);

      const mapInstance = map?.getMap();
      updateMapLabels(mapInstance, langCode);
    },
    [map]
  );

  return (
    <CustomControl position="topRight">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ControlButton
            title="Map Language"
            icon={<LanguagesIcon size={17} />}
          />
        </PopoverTrigger>
        <PopoverContent className="mt-1 mr-2 rounded-md animate-in fade-in-0 zoom-in-95 w-[220px] p-2">
          <div className="flex flex-col gap-0.5">
            {mapLanguageOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleLanguageChange(option.value)}
                className={`text-left px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent ${
                  selectedLanguage === option.value
                    ? 'bg-accent font-medium'
                    : ''
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </CustomControl>
  );
};
