"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] border-none bg-white rounded-2xl shadow-2xl overflow-hidden p-0">
        <div className="relative h-2 bg-emerald-600 w-full" />
        <div className="p-6 pt-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-inner">
              <AlertTriangle size={32} />
            </div>
            
            <DialogHeader className="gap-2">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Sign Out?
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-base leading-relaxed">
                Are you sure you want to sign out? You will need to log in again to access your dashboard.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="mt-8 gap-3 sm:gap-2 sm:flex-row flex-col">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 rounded-xl h-12 font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              className="flex-1 rounded-xl h-12 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
