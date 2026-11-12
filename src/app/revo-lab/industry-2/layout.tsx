import type { Metadata } from "next";
import "./electric.css";
import "./gameplay.css";
import "./consistency.css";

export const metadata: Metadata = {
  title: "The Age of Electricity — REVO",
  description: "Jelajahi elektrifikasi pabrik, motor, dan lini perakitan dalam diorama edukatif Industry 2.0.",
};

export default function ElectricLayout({ children }: { children: React.ReactNode }) {
  return children;
}
