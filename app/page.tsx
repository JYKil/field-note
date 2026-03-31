"use client";

import { useState } from "react";
import { RouteProvider } from "@/lib/RouteContext";
import { ToastProvider } from "@/lib/ToastContext";
import Toolbar from "@/components/Toolbar";
import RouteList from "@/components/RouteList";
import NaverMap from "@/components/NaverMap";
import Toast from "@/components/Toast";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapDark, setMapDark] = useState(false);

  return (
    <ToastProvider>
      <RouteProvider>
        <div className="flex h-screen">
          {/* 모바일 오버레이 */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* 사이드바 */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-40 w-60 bg-sidebar flex flex-col border-r border-zinc-800
              transition-transform duration-200 ease-out
              md:relative md:translate-x-0 md:shrink-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            {/* 상단 고정 영역 */}
            <div className="sticky top-0 bg-sidebar z-10">
              <div className="flex items-center justify-between px-4 py-4">
                <h1 className="text-lg font-semibold">fieldNote</h1>
                <div className="flex items-center gap-1">
                  {/* 지도 다크모드 토글 */}
                  <button
                    className={`p-1.5 rounded-md cursor-pointer transition-colors ${mapDark ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-100"}`}
                    onClick={() => setMapDark((v) => !v)}
                    aria-label={mapDark ? "지도 라이트모드" : "지도 다크모드"}
                    title={mapDark ? "지도 라이트모드" : "지도 다크모드"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {mapDark ? (
                        <>{/* 해 아이콘 (다크모드 ON → 클릭하면 라이트로) */}
                          <circle cx="12" cy="12" r="5" />
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </>
                      ) : (
                        /* 달 아이콘 (라이트모드 → 클릭하면 다크로) */
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      )}
                    </svg>
                  </button>
                  <button
                    className="md:hidden p-1 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="사이드바 닫기"
                  >
                    ✕
                  </button>
                </div>
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
            {/* 모바일 사이드바 토글 */}
            <button
              className="absolute top-3 left-3 z-20 md:hidden bg-sidebar/90 backdrop-blur text-zinc-100 p-2.5 rounded-lg shadow-lg cursor-pointer hover:bg-zinc-700 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <NaverMap darkMode={mapDark} />
          </main>
        </div>
        <Toast />
      </RouteProvider>
    </ToastProvider>
  );
}
