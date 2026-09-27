import { Heebo, Inter, Rubik, Source_Serif_4 } from "next/font/google";

// Shared by the website and app root layouts.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });
// Hebrew headings: a smooth, modern sans that pairs with Heebo body text.
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });

export const fontVariables = `${inter.variable} ${sourceSerif.variable} ${heebo.variable} ${rubik.variable}`;
