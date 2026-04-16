"use client";

import { ConfirmationModal } from "./ConfirmationModal";

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
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sign Out?"
      description="Are you sure you want to sign out? You will need to log in again to access your dashboard."
      confirmText="Sign Out"
      variant="danger"
    />
  );
}
