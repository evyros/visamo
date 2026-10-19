import { Fraunces, Heebo, Inter, Rubik } from "next/font/google";

// Shared by the website and app root layouts.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// English headings and the logo wordmark. SOFT rounds the shapes; opsz lets it adapt to the size.
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz", "SOFT"], variable: "--font-fraunces", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });
// Hebrew headings: a smooth, modern sans that pairs with Heebo body text.
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });

export const fontVariables = `${inter.variable} ${fraunces.variable} ${heebo.variable} ${rubik.variable}`;
