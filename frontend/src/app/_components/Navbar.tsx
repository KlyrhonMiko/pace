"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "./auth/LoginModal";

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 border-b border-emerald-100 bg-white sticky top-0 z-50" />}>
      <NavbarContent />
    </Suspense>
  );
}

function NavbarContent() {
  const { isAuthenticated, logout, getDashboardUrl } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    if (searchParams.get("login") === "true") {
      setIsLoginModalOpen(true);
    }
  }, [searchParams]);

  return (
    <nav className="border-b border-emerald-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/plp-logo.png?v=2"
              alt="PLP Logo"
              width="40"
              height="40"
              className="object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold text-slate-900 leading-none tracking-tight group-hover:text-emerald-800 transition-colors">
              Pamantasan ng Lungsod ng Pasig
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-[0.2em] mt-0.5 hidden sm:block">
              Alumni & Career
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {mounted && isAuthenticated ? (
            <>
              <Link href={getDashboardUrl()}>
                <Button variant="ghost" className="hidden sm:inline-flex text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50">
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={() => logout()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-200"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden sm:inline-flex text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50"
              >
                Sign In
              </Button>
              <Link href="/register">
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-200">
                  For Employers
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
      />
    </nav>
  );
}
