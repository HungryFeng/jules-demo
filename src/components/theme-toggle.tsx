"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    // If theme is light or system, switch to dark. Otherwise, switch to light.
    if (theme === "light" || theme === "system") {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {/* Show Sun icon to indicate a switch to Light mode when current theme is Dark */}
      {/* Show Moon icon to indicate a switch to Dark mode when current theme is Light or System */}
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
