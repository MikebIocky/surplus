import { redirect } from "next/navigation";

export default function Home() {
  redirect("/listings");
  return null;
}