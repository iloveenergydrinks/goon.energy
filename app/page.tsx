"use client";
import SizePicker from "@/components/home/SizePicker";
import PrimaryPicker from "@/components/home/PrimaryPicker";
import SecondaryPicker from "@/components/home/SecondaryPicker";
import SeedInput from "@/components/home/SeedInput";
import { useFittingStore } from "@/store/useFittingStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const generate = useFittingStore((s) => s.generate);
  const router = useRouter();
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Ship Fitting Builder</h1>
      <div className="grid gap-6">
        <SizePicker />
        <PrimaryPicker />
        <SecondaryPicker />
        <SeedInput />
      </div>
      <div>
        <button
          onClick={() => {
            generate();
            router.push("/builder");
          }}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Generate Grid →
        </button>
      </div>
    </div>
  );
}
