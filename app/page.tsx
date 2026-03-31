"use client";

import { RouteProvider } from "@/lib/RouteContext";
import { ToastProvider } from "@/lib/ToastContext";
import Toolbar from "@/components/Toolbar";
import RouteList from "@/components/RouteList";
import NaverMap from "@/components/NaverMap";
import Toast from "@/components/Toast";

export default function Home() {
  return (
    <ToastProvider>
      <RouteProvider>
        <div className="flex h-screen">
          {/* 사이드바 */}
          <aside className="w-60 bg-sidebar flex flex-col border-r border-zinc-800 shrink-0">
            {/* 상단 고정 영역 */}
            <div className="sticky top-0 bg-sidebar z-10">
              <div className="px-4 py-4">
                <h1 className="text-lg font-semibold">fieldNote</h1>
              </div>
              <Toolbar />
              <div className="border-b border-zinc-800" />
            </div>

            {/* 루트 리스트 (스크롤) */}
            <div className="flex-1 overflow-y-auto py-2">
              <RouteList />
            </div>
          </aside>

          {/* 지도 영역 */}
          <main className="flex-1 relative">
            <NaverMap />
          </main>
        </div>
        <Toast />
      </RouteProvider>
    </ToastProvider>
  );
}
