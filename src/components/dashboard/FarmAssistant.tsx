import { useMemo, useState } from "react";
import { formatSquareMeters } from "@/utils/areaUnits";
import { Bot, Send, X } from "lucide-react";
import type { CensusStatistics } from "@/types";

interface FarmAssistantProps {
  stats: CensusStatistics;
  contextLabel?: string;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[?.!,]/g, " ").replace(/\s+/g, " ").trim();
}

export function FarmAssistant({ stats, contextLabel = "whole platform" }: FarmAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState(
    "Ask me about the whole platform: vegetation totals, vegetation types, farms, wilayats, governorates, averages, or surveyed area."
  );

  const typeMap = useMemo(() => {
    const map = new Map<string, { treeType: string; count: number }>();
    for (const item of stats.treesByType) map.set(normalize(item.treeType), item);
    return map;
  }, [stats.treesByType]);

  const wilayatMap = useMemo(() => {
    const map = new Map<string, { wilayat: string; vegetation: number; farms: number }>();
    for (const row of stats.treesByWilayat) {
      map.set(normalize(row.wilayat), { wilayat: row.wilayat, vegetation: row.count, farms: 0 });
    }
    for (const row of stats.farmsByWilayat) {
      const key = normalize(row.wilayat);
      const current = map.get(key) ?? { wilayat: row.wilayat, vegetation: 0, farms: 0 };
      current.farms = row.count;
      map.set(key, current);
    }
    return map;
  }, [stats.treesByWilayat, stats.farmsByWilayat]);

  const governorateMap = useMemo(() => {
    const map = new Map<string, { governorate: string; vegetation: number }>();
    for (const row of stats.treesByGovernorate) {
      map.set(normalize(row.governorate), { governorate: row.governorate, vegetation: row.count });
    }
    return map;
  }, [stats.treesByGovernorate]);

  function ask() {
    const raw = input.trim();
    const q = normalize(raw);
    if (!q) return;

    const mentionedType = [...typeMap.entries()].find(([name]) => name && q.includes(name));
    const mentionedWilayat = [...wilayatMap.entries()].find(([name]) => name && q.includes(name));
    const mentionedGovernorate = [...governorateMap.entries()].find(([name]) => name && q.includes(name));
    const dominant = stats.treesByType[0];

    if (mentionedType) {
      const item = mentionedType[1];
      const share = stats.totalTrees ? Math.round((item.count / stats.totalTrees) * 100) : 0;
      setAnswer(`${item.treeType}: ${item.count.toLocaleString()} vegetation records across the ${contextLabel}, about ${share}% of the total vegetation.`);
    } else if (mentionedWilayat) {
      const item = mentionedWilayat[1];
      if (q.includes("farm")) {
        setAnswer(`${item.wilayat} has ${item.farms.toLocaleString()} surveyed farm${item.farms === 1 ? "" : "s"} in the ${contextLabel}.`);
      } else {
        setAnswer(`${item.wilayat} has ${item.vegetation.toLocaleString()} vegetation records across ${item.farms.toLocaleString()} surveyed farm${item.farms === 1 ? "" : "s"}.`);
      }
    } else if (mentionedGovernorate) {
      const item = mentionedGovernorate[1];
      setAnswer(`${item.governorate} has ${item.vegetation.toLocaleString()} vegetation records in the ${contextLabel}.`);
    } else if ((q.includes("how many") || q.includes("total") || q.includes("count")) && (q.includes("type") || q.includes("species"))) {
      setAnswer(`There are ${stats.treeTypeCount.toLocaleString()} vegetation types across the ${contextLabel}.`);
    } else if ((q.includes("how many") || q.includes("total") || q.includes("count")) && (q.includes("tree") || q.includes("vegetation") || q.includes("plant"))) {
      setAnswer(`There are ${stats.totalTrees.toLocaleString()} individual vegetation records across the ${contextLabel}.`);
    } else if ((q.includes("how many") || q.includes("total") || q.includes("count")) && q.includes("farm")) {
      setAnswer(`There are ${stats.totalFarms.toLocaleString()} surveyed farms across the ${contextLabel}.`);
    } else if (q.includes("dominant") || q.includes("top type") || q.includes("most common") || q.includes("main vegetation")) {
      setAnswer(dominant ? `${dominant.treeType} is the dominant vegetation type with ${dominant.count.toLocaleString()} records across the ${contextLabel}.` : "No dominant vegetation type is available.");
    } else if (q.includes("type") || q.includes("species") || q.includes("breakdown")) {
      const top = stats.treesByType.slice(0, 10).map((t) => `${t.treeType} (${t.count.toLocaleString()})`).join(", ");
      setAnswer(top ? `Top vegetation types across the ${contextLabel}: ${top}.` : "No vegetation types are available.");
    } else if (q.includes("area") || q.includes("coverage") || q.includes("square meter") || q.includes("m2") || q.includes("m²")) {
      setAnswer(`The surveyed farm area across the ${contextLabel} is ${formatSquareMeters(stats.totalSurveyedAreaHa)}.`);
    } else if (q.includes("governorate")) {
      const names = stats.treesByGovernorate.map((r) => r.governorate).filter(Boolean).join(", ");
      setAnswer(`The ${contextLabel} covers ${stats.governoratesCovered.toLocaleString()} governorate${stats.governoratesCovered === 1 ? "" : "s"}${names ? `: ${names}` : ""}.`);
    } else if (q.includes("wilayat")) {
      const names = stats.treesByWilayat.map((r) => r.wilayat).filter(Boolean).join(", ");
      setAnswer(`The ${contextLabel} covers ${stats.wilayatsCovered.toLocaleString()} wilayat${stats.wilayatsCovered === 1 ? "" : "s"}${names ? `: ${names}` : ""}.`);
    } else if (q.includes("average") && q.includes("farm")) {
      const avg = stats.totalFarms ? Math.round(stats.totalTrees / stats.totalFarms) : 0;
      setAnswer(`The platform-wide average is ${avg.toLocaleString()} vegetation records per surveyed farm.`);
    } else {
      setAnswer("I can answer platform-wide questions such as: “How many Palm records?”, “How many farms are in Barka?”, “What is the dominant vegetation type?”, “List the wilayats”, “What is the surveyed area?”, or “What is the average vegetation per farm?”");
    }
    setInput("");
  }

  return (
    <div className="farm-assistant-wrap">
      {open && (
        <div className="farm-assistant-panel">
          <div className="farm-assistant-header"><span><Bot size={16} /> Platform Assistant</span><button onClick={() => setOpen(false)}><X size={15} /></button></div>
          <div className="farm-assistant-body">
            <p>{answer}</p>
            <div className="farm-assistant-suggestions">Try: “How many Palm records?” · “Farms in Barka” · “Dominant vegetation type” · “Surveyed area”</div>
          </div>
          <div className="farm-assistant-input">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about the whole platform…" />
            <button onClick={ask}><Send size={14} /></button>
          </div>
        </div>
      )}
      <button
        className="farm-assistant-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open platform assistant"
        title="Open Platform Assistant"
      ><Bot size={19} /></button>
    </div>
  );
}
