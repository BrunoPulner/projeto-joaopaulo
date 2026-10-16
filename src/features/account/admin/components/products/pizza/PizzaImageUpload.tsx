
import { useEffect, useState } from "react";

import {
  ImagePlus,
  ImageOff,
  X,
} from "lucide-react";

// ============================================
// CONFIGURAÇÕES
// ============================================

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ============================================
// PROPRIEDADES
// ============================================

interface PizzaImageUploadProps {
  label?: string;
  description?: string;

  imageUrl?: string | null;

  selectedFile: File | null;
  onFileChange: (file: File | null) => void;

  disabled?: boolean;
  required?: boolean;

  error?: string;
}

// ============================================
// COMPONENTE
// ============================================

export function PizzaImageUpload({
  label = "Imagem",
  description = "Selecione uma imagem JPG, PNG ou WebP.",
  imageUrl = null,
  selectedFile,
  onFileChange,
  disabled = false,
  required = false,
  error,
}: PizzaImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null,
  );

  const [localError, setLocalError] = useState("");

  // ==========================================
  // PRÉVIA DA IMAGEM
  // ==========================================

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const imageSource = selectedFile
    ? previewUrl
    : imageUrl;

  // ==========================================
  // SELECIONAR ARQUIVO
  // ==========================================

  function handleFileChange(file: File | null) {
    setLocalError("");

    if (!file) {
      onFileChange(null);
      setPreviewUrl(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLocalError(
        "Selecione uma imagem JPG, PNG ou WebP.",
      );
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError(
        "A imagem deve ter no máximo 5 MB.",
      );
      return;
    }

    onFileChange(file);
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="space-y-3">
      {/* Título */}

      <div>
        <label className="block text-sm font-bold text-slate-800">
          {label}

          {required && (
            <span className="ml-1 text-red-600">*</span>
          )}
        </label>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      {/* Prévia */}

      <div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        {imageSource ? (
          <img
            src={imageSource}
            alt={`Prévia: ${label}`}
            className="h-52 w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <ImageOff
              size={30}
              className="text-slate-300"
            />

            <p className="text-sm font-medium text-slate-500">
              Nenhuma imagem selecionada
            </p>
          </div>
        )}

        {selectedFile && !disabled && (
          <button
            type="button"
            onClick={() => handleFileChange(null)}
            aria-label="Remover imagem selecionada"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm transition hover:bg-red-50"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Seleção */}

      <label
        className={`
          flex min-h-12 cursor-pointer
          items-center justify-center gap-2
          rounded-xl border border-orange-200
          bg-orange-50 px-4 py-3
          text-sm font-bold text-orange-800
          transition hover:bg-orange-100
          ${
            disabled
              ? "pointer-events-none opacity-50"
              : ""
          }
        `}
      >
        <ImagePlus size={19} />

        {selectedFile
          ? "Trocar imagem"
          : imageUrl
            ? "Substituir imagem"
            : "Selecionar imagem"}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            handleFileChange(
              event.target.files?.[0] ?? null,
            );

            event.target.value = "";
          }}
        />
      </label>

      {/* Arquivo selecionado */}

      {selectedFile && (
        <p className="truncate text-xs text-slate-500">
          Arquivo: {selectedFile.name}
        </p>
      )}

      {/* Erros */}

      {(localError || error) && (
        <p
          role="alert"
          className="text-xs font-semibold text-red-600"
        >
          {localError || error}
        </p>
      )}
    </div>
  );
}
