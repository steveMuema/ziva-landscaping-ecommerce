"use client"

import * as React from "react"
import { MoonIcon, SunIcon, PaintBrushIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline"
import { useTheme } from "@/lib/themeContext"
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="relative inline-block text-left">
                <div>
                    <div className="inline-flex items-center justify-center rounded-md p-2 text-[var(--header-fg)] hover:bg-[var(--muted-bg)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]">
                        <span className="sr-only">Open theme menu</span>
                        <div className="h-6 w-6 opacity-0" aria-hidden="true" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <MenuButton className="inline-flex items-center justify-center rounded-md p-2 text-[var(--header-fg)] hover:bg-[var(--muted-bg)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]">
                    <span className="sr-only">Open theme menu</span>
                    {theme === "system" ? (
                        <ComputerDesktopIcon className="h-6 w-6" aria-hidden="true" />
                    ) : theme === "light" ? (
                        <SunIcon className="h-6 w-6" aria-hidden="true" />
                    ) : theme === "dark" ? (
                        <MoonIcon className="h-6 w-6" aria-hidden="true" />
                    ) : (
                        <PaintBrushIcon className="h-6 w-6" aria-hidden="true" />
                    )}
                </MenuButton>
            </div>

            <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <MenuItems className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-md bg-[var(--card-bg)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-[var(--card-border)] overflow-hidden">
                    <div className="py-1">
                        <MenuItem>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`${active ? "bg-[var(--muted-bg)]" : ""
                                        } block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] ${theme === "system" ? "font-bold text-[var(--accent)]" : ""}`}
                                >
                                    System (Native)
                                </button>
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`${active ? "bg-[var(--muted-bg)]" : ""
                                        } block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] ${theme === "light" ? "font-bold text-[var(--accent)]" : ""}`}
                                >
                                    Light
                                </button>
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`${active ? "bg-[var(--muted-bg)]" : ""
                                        } block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] ${theme === "dark" ? "font-bold text-[var(--accent)]" : ""}`}
                                >
                                    Dark
                                </button>
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("cyan")}
                                    className={`${active ? "bg-[var(--muted-bg)]" : ""
                                        } block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] ${theme === "cyan" ? "font-bold text-[var(--accent)]" : ""}`}
                                >
                                    Cyan
                                </button>
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("blue")}
                                    className={`${active ? "bg-[var(--muted-bg)]" : ""
                                        } block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] ${theme === "blue" ? "font-bold text-[var(--accent)]" : ""}`}
                                >
                                    Blue
                                </button>
                            )}
                        </MenuItem>
                    </div>
                </MenuItems>
            </Transition>
        </Menu>
    )
}
