import React from "react";

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger", // 'danger' para exclusões, 'info' para alertas simples
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const isAlert = type === "alert";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 transform transition-all scale-100">
        {/* Título */}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        {/* Mensagem */}
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-2">
          {!isAlert && (
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`px-4.5 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm ${
              type === "danger"
                ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/20"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
