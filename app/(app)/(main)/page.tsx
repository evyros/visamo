import { redirect } from "next/navigation";

// The app opens on the file.
export default function AppHome() {
  redirect("/file");
}
