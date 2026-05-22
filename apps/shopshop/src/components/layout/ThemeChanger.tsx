"use client";

/**
 * UI for switching themes in this application.
 */

// External Modules ----------------------------------------------------------

import { Button } from "@repo/daisy-ui/Button";
import { Menu } from "@repo/daisy-ui/Menu";
import { Palette } from "lucide-react";

// Internal Modules ----------------------------------------------------------

import { useThemeContext } from "@/contexts/ThemeContext";

// Public Objects ------------------------------------------------------------

export function ThemeChanger() {

  const { changeTheme, theme } = useThemeContext();

  const capitalize = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  return (
    <Menu
      overflow="auto"
      trigger={
        <Button color="ghost">
          <Palette size={32}/>
          Theme
        </Button>
      }
    >
      {COMMON_THEMES.map((themeName) => (
        <Menu.Item
          className={themeName === theme ? "font-bold" : "font-normal"}
          key={themeName}
          onAction={() => changeTheme(themeName)}
        >
          {capitalize(themeName)}
        </Menu.Item>
      ))}

      <Menu.Separator />

      {THEME_GROUPS.map((group) => (
        <Menu.Submenu key={group.label} label={`${group.label} (${group.themes.length})`}>
          {group.themes.map((themeName) => (
            <Menu.Item
              className={themeName === theme ? "font-bold" : "font-normal"}
              key={themeName}
              onAction={() => changeTheme(themeName)}
            >
              {capitalize(themeName)}
            </Menu.Item>
          ))}
        </Menu.Submenu>
      ))}
    </Menu>
  )

}

// Private Objects -----------------------------------------------------------

// Keep this list in sync with the installed themes in globals.css
const THEMES = [
  "light",
  "dark",
  "abyss",
  "acid",
  "aqua",
  "autumn",
  "black",
  "bumblebee",
  "business",
  "caramellatte",
  "cmyk",
  "coffee",
  "corporate",
  "cupcake",
  "cyberpunk",
  "dim",
  "dracula",
  "emerald",
  "fantasy",
  "forest",
  "garden",
  "halloween",
  "lemonade",
  "lofi",
  "luxury",
  "night",
  "nord",
  "pastel",
  "retro",
  "silk",
  "sunset",
  "synthwave",
  "valentine",
  "winter",
  "wireframe",
];

const COMMON_THEMES = ["light", "dark"] as const;

type ThemeGroup = {
  label: string;
  themes: string[];
}

const THEME_GROUPS: ThemeGroup[] = [
  {
    label: "Light",
    themes: [
      "autumn",
      "caramellatte",
      "cmyk",
      "corporate",
      "emerald",
      "garden",
      "lemonade",
      "lofi",
      "nord",
      "pastel",
      "silk",
      "winter",
      "wireframe",
    ],
  },
  {
    label: "Dark",
    themes: [
      "abyss",
      "black",
      "business",
      "coffee",
      "dim",
      "dracula",
      "forest",
      "luxury",
      "night",
      "sunset",
    ],
  },
  {
    label: "Playful",
    themes: [
      "acid",
      "aqua",
      "bumblebee",
      "cupcake",
      "cyberpunk",
      "fantasy",
      "halloween",
      "retro",
      "synthwave",
      "valentine",
    ],
  },
].map((group) => ({
  ...group,
  themes: group.themes
    .filter((themeName) => THEMES.includes(themeName))
    .sort((left, right) => left.localeCompare(right)),
}));

