"use client";

import { useRef } from "react";
import { useRoutes } from "@/lib/RouteContext";
import { useToast } from "@/lib/ToastContext";
import { parseGpx } from "@/lib/gpx";
import { generateGpx } from "@/lib/gpx";

export default function Toolbar() {
  const { state, dispatch } = useRoutes();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRoute = () => {
    dispatch({ type: "ADD_ROUTE" });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { routes, warnings } = parseGpx(text, state.routes.length);
      dispatch({ type: "IMPORT_ROUTES", routes });

      if (warnings.length > 0) {
        warnings.forEach((w) => showToast(w, "info"));
      }
      showToast(`루트 ${routes.length}개 불러옴`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "GPX 파일 읽기 실패",
        "error",
      );
    }

    // input 리셋 (같은 파일 다시 선택 가능)
    e.target.value = "";
  };

  const handleExport = () => {
    const routesWithWaypoints = state.routes.filter(
      (r) => r.waypoints.length > 0,
    );
    if (routesWithWaypoints.length === 0) {
      showToast("내보낼 루트가 없습니다", "info");
      return;
    }

    const gpxString = generateGpx(routesWithWaypoints);
    const blob = new Blob([gpxString], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fieldnote.gpx";
    a.click();
    URL.revokeObjectURL(url);
    showToast("GPX 다운로드 완료", "success");
  };

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <button
        className="w-full min-h-[44px] py-2 text-sm font-medium rounded-md bg-accent text-zinc-950 hover:brightness-110 transition cursor-pointer"
        onClick={handleAddRoute}
      >
        + 새 루트
      </button>
      <div className="flex gap-2">
        <button
          className="flex-1 min-h-[44px] py-2 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
          onClick={handleImport}
        >
          GPX 불러오기
        </button>
        <button
          className="flex-1 min-h-[44px] py-2 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
          onClick={handleExport}
        >
          GPX 다운로드
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
