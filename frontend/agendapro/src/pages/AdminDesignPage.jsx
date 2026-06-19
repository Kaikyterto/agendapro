import { useEffect, useState } from "react";
import {
  Palette,
  Loader2,
  Sparkles,
  Eye,
  HelpCircle,
  RotateCcw,
  Calendar,
  ShoppingBag,
} from "lucide-react";

import Button from "../components/Button";
import { uploadImage } from "../services/upload";
import { getDesignSettings, updateDesignSettings } from "../services/design";

const initialForm = {
  name: "", // Mapeado dinamicamente para {company?.name} no preview
  about: "",
  primary_color: "#3b82f6",
  secondary_color: "#64748b",
  logo_url: "",
};

const AdminDesignPage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const designData = await getDesignSettings();

      if (designData) {
        setForm({
          name: designData.name || "",
          about: designData.about || "",
          primary_color: designData.primary_color || "#3b82f6",
          secondary_color: designData.secondary_color || "#64748b",
          logo_url: designData.logo_url || "",
        });
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar configurações de design");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetColors = () => {
    setForm((prev) => ({
      ...prev,
      primary_color: "#3b82f6",
      secondary_color: "#64748b",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      let logoUrl = form.logo_url;

      if (imageFile) {
        setUploadingImage(true);
        try {
          const upload = await uploadImage(imageFile, "logos");
          logoUrl = upload.url;
        } catch (err) {
          console.error(err);
          setError(err?.response?.data?.message || "Erro ao enviar a logo");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        about: form.about.trim(),
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        logo_url: logoUrl || null,
      };

      await updateDesignSettings(payload);
      setSuccess("Identidade visual atualizada com sucesso!");

      setForm((prev) => ({ ...prev, logo_url: logoUrl }));
      setImageFile(null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Erro ao salvar configurações");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="animate-spin text-[#c084fc]" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10 shrink-0">
              <Palette size={26} className="text-violet-300" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent truncate">
                Aparência
              </h1>
              <p className="text-white/50 text-xs sm:text-sm mt-1 truncate">
                Ajuste e customize as cores e identidade da sua plataforma
              </p>
            </div>
          </div>
        </div>

        {/* LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUNA ESQUERDA - CONFIGURAÇÕES */}
          <div className="lg:col-span-7 bg-[#111827] border border-violet-500/10 rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-400" />
                  Configuração da Marca
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Clique nas esferas de cor para abrir o seletor cromático
                  ajustável.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetColors}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white/70"
                title="Restaurar padrão"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SELETORES DE COR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* COR PRIMÁRIA */}
                <div className="bg-[#0f172a] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <label className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider self-start">
                    Cor Primária
                  </label>

                  <div className="relative group cursor-pointer w-24 h-24 mb-4">
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-40 transition-opacity group-hover:opacity-70"
                      style={{ backgroundColor: form.primary_color }}
                    />
                    <label
                      className="relative block w-full h-full rounded-full border-2 border-white/20 overflow-hidden shadow-inner transform transition-transform active:scale-95"
                      style={{
                        background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 100%), ${form.primary_color}`,
                      }}
                    >
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) =>
                          handleChange("primary_color", e.target.value)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    maxLength={7}
                    value={form.primary_color}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    className="w-full text-center h-10 bg-[#111827] border border-white/10 rounded-xl px-3 outline-none text-xs text-white font-mono focus:border-violet-400"
                  />
                </div>

                {/* COR SECUNDÁRIA */}
                <div className="bg-[#0f172a] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <label className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider self-start">
                    Cor Secundária
                  </label>

                  <div className="relative group cursor-pointer w-24 h-24 mb-4">
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-40 transition-opacity group-hover:opacity-70"
                      style={{ backgroundColor: form.secondary_color }}
                    />
                    <label
                      className="relative block w-full h-full rounded-full border-2 border-white/20 overflow-hidden shadow-inner transform transition-transform active:scale-95"
                      style={{
                        background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 100%), ${form.secondary_color}`,
                      }}
                    >
                      <input
                        type="color"
                        value={form.secondary_color}
                        onChange={(e) =>
                          handleChange("secondary_color", e.target.value)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    maxLength={7}
                    value={form.secondary_color}
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    className="w-full text-center h-10 bg-[#111827] border border-white/10 rounded-xl px-3 outline-none text-xs text-white font-mono focus:border-violet-400"
                  />
                </div>
              </div>

              {/* TEXTAREA SOBRE A EMPRESA */}
              <div>
                <label className="text-xs sm:text-sm text-white/60 mb-1.5 block font-medium">
                  Sobre a Empresa (Institucional)
                </label>
                <textarea
                  value={form.about}
                  onChange={(e) => handleChange("about", e.target.value)}
                  rows={3}
                  placeholder="Descreva brevemente o seu negócio..."
                  className="w-full rounded-xl sm:rounded-2xl bg-[#0f172a] border border-white/10 px-4 py-3 outline-none resize-none focus:border-violet-400 transition-all text-sm text-white placeholder:text-white/20"
                />
              </div>

              {/* UPLOAD DA LOGO */}
              <div>
                <label className="text-xs sm:text-sm text-white/60 mb-1.5 block font-medium">
                  Logotipo da Empresa
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImageFile(file);
                  }}
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#0f172a] border border-white/10 px-4 py-2 text-xs sm:text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-500/20 file:text-violet-300 cursor-pointer"
                />
              </div>

              {/* ALERTAS */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  {success}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white rounded-xl sm:rounded-2xl font-bold mt-2 disabled:opacity-60 border-0 justify-center text-sm sm:text-base text-center"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Salvando Design...
                  </span>
                ) : (
                  "Salvar Configurações"
                )}
              </Button>
            </form>
          </div>

          {/* PREVIEW INTERATIVO ATUALIZADO COMPATÍVEL COM O NOVO VISUAL DA HOME */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
            <div className="flex items-center gap-2 px-1 text-white/60 text-xs font-bold uppercase tracking-wider">
              <Eye size={14} /> Pré-visualização em tempo real
            </div>

            <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#07090d] border border-white/10 overflow-hidden shadow-2xl scale-[0.92] origin-top min-h-[480px] flex flex-col justify-between">
              {/* BACKGROUND AURORA FIEL À REALIDADE */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none mix-blend-screen"
                style={{
                  background: `
                    radial-gradient(circle at 15% 25%, ${form.primary_color} 0%, transparent 45%),
                    radial-gradient(circle at 85% 75%, ${form.secondary_color} 0%, transparent 45%)
                  `,
                }}
              />

              {/* NAVBAR MINIATURA (IMAGEM CENTRALIZADA) */}
              <div className="relative z-10 flex items-center justify-center px-4 py-3 border-b border-white/10 bg-[#07090d]/60 backdrop-blur-md">
                {previewUrl || form.logo_url ? (
                  <img
                    src={previewUrl || form.logo_url}
                    alt="Logo Preview"
                    className="h-5 max-w-[120px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-white/30 font-bold tracking-wider uppercase">
                    Logo
                  </span>
                )}
              </div>

              {/* GRID INTERNO REESTRUTURADO PARA SIMULAR AS DUAS COLUNAS DA HOME PAGE */}
              <div className="relative z-10 p-5 flex-1 flex flex-col justify-center gap-6">
                {/* 1. MOLDURA PREMIUM DE DESTAQUE PARA A LOGO (Simula a Right Column) */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-[150px] aspect-square flex items-center justify-center">
                    {/* Brilho de fundo */}
                    <div
                      className="absolute inset-0 blur-2xl opacity-40 rounded-full"
                      style={{ backgroundColor: form.primary_color }}
                    />
                    {/* Card de Vidro da Logo */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.1] backdrop-blur-md rounded-2xl p-4 flex items-center justify-center shadow-lg">
                      {previewUrl || form.logo_url ? (
                        <img
                          src={previewUrl || form.logo_url}
                          alt="Logo Hero"
                          className="max-w-full max-h-full object-contain filter drop-shadow-md"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white"
                          style={{
                            background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`,
                          }}
                        >
                          {form.name ? form.name.charAt(0).toUpperCase() : "E"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. TEXTOS E BOTÕES (Simula a Left Column centralizada no preview) */}
                <div className="text-center">
                  <h1 className="text-xl font-black tracking-tight leading-tight mb-1 bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                    {form.name || "Minha Empresa"}
                  </h1>

                  <p className="text-[11px] text-white/50 mb-4 line-clamp-2 max-w-[240px] mx-auto leading-relaxed">
                    {form.about ||
                      "Bem-vindo à nossa plataforma de agendamentos e produtos."}
                  </p>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 w-full max-w-[180px] mx-auto">
                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                      style={{ backgroundColor: form.primary_color }}
                    >
                      <Calendar size={11} />
                      Agendar Serviço
                    </button>

                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 border border-white/10 bg-white/5 backdrop-blur-sm"
                    >
                      <ShoppingBag size={11} />
                      Ver Produtos
                    </button>
                  </div>
                </div>
              </div>

              {/* FOOTER DO PREVIEW */}
              <div className="relative z-10 p-2 text-center border-t border-white/5 bg-[#07090d]/40">
                <div className="text-[10px] text-white/30 flex items-center justify-center gap-1">
                  <HelpCircle size={10} /> Miniatura sincronizada com o novo
                  layout hero
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDesignPage;
