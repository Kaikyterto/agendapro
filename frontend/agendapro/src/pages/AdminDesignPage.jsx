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
  name: "",
  about: "",
  primary_color: "#3b82f6",
  secondary_color: "#64748b",
  background_color: "#07090d",
  text_color: "#ffffff",
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
        // AJUSTE AQUI: Mapeando corretamente caso a API retorne 'background' ou 'background_color'
        setForm({
          name: designData.name || "",
          about: designData.about || "",
          primary_color:
            designData.colors?.primary || designData.primary_color || "#3b82f6",
          secondary_color:
            designData.colors?.secondary ||
            designData.secondary_color ||
            "#64748b",
          background_color:
            designData.colors?.background ||
            designData.background_color ||
            designData.background ||
            "#07090d",
          text_color:
            designData.colors?.text ||
            designData.text_color ||
            designData.text ||
            "#ffffff",
          logo_url: designData.logo_url || designData.logo || "",
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
      background_color: "#07090d",
      text_color: "#ffffff",
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

      // AJUSTE AQUI: Formatando o payload combinando com a estrutura que a HomePage consome
      const payload = {
        name: form.name.trim(),
        about: form.about.trim(),
        logo_url: logoUrl || null,
        colors: {
          primary: form.primary_color,
          secondary: form.secondary_color,
          background: form.background_color,
          text: form.text_color,
        },
      };

      await updateDesignSettings(payload);
      setSuccess("Identidade visual actualizada com sucesso!");

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CONFIGURATION FORM */}
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
              {/* NOME E SOBRE */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs sm:text-sm text-white/60 mb-1.5 block font-medium">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ex: Minha Barbearia"
                    className="w-full rounded-xl bg-[#0f172a] border border-white/10 px-4 h-12 outline-none focus:border-violet-400 transition-all text-sm text-white"
                  />
                </div>
              </div>

              {/* SELETORES DE COR */}
              <div className="grid grid-cols-2 gap-4">
                {/* COR PRIMÁRIA */}
                <div className="bg-[#0f172a] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <label className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider self-start">
                    Cor Primária
                  </label>
                  <div className="relative group cursor-pointer w-20 h-20 mb-3">
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
                    className="w-full text-center h-9 bg-[#111827] border border-white/10 rounded-xl px-2 outline-none text-xs text-white font-mono focus:border-violet-400"
                  />
                </div>

                {/* COR ACCENT / SECUNDÁRIA */}
                <div className="bg-[#0f172a] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <label className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider self-start">
                    Cor Accent
                  </label>
                  <div className="relative group cursor-pointer w-20 h-20 mb-3">
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
                    className="w-full text-center h-9 bg-[#111827] border border-white/10 rounded-xl px-2 outline-none text-xs text-white font-mono focus:border-violet-400"
                  />
                </div>

                {/* COR DE FUNDO */}
                <div className="bg-[#0f172a] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <label className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider self-start">
                    Cor de Fundo
                  </label>
                  <div className="relative group cursor-pointer w-20 h-20 mb-3">
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-40 transition-opacity group-hover:opacity-70"
                      style={{ backgroundColor: form.background_color }}
                    />
                    <label
                      className="relative block w-full h-full rounded-full border-2 border-white/20 overflow-hidden shadow-inner transform transition-transform active:scale-95"
                      style={{
                        background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 100%), ${form.background_color}`,
                      }}
                    >
                      <input
                        type="color"
                        value={form.background_color}
                        onChange={(e) =>
                          handleChange("background_color", e.target.value)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    maxLength={7}
                    value={form.background_color}
                    onChange={(e) =>
                      handleChange("background_color", e.target.value)
                    }
                    className="w-full text-center h-9 bg-[#111827] border border-white/10 rounded-xl px-2 outline-none text-xs text-white font-mono focus:border-violet-400"
                  />
                </div>

                {/* COR DO TEXTO */}
                <div className="bg-[#0f172a] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                  <label className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider self-start">
                    Cor do Texto
                  </label>
                  <div className="relative group cursor-pointer w-20 h-20 mb-3">
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-40 transition-opacity group-hover:opacity-70"
                      style={{ backgroundColor: form.text_color }}
                    />
                    <label
                      className="relative block w-full h-full rounded-full border-2 border-white/20 overflow-hidden shadow-inner transform transition-transform active:scale-95"
                      style={{
                        background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 100%), ${form.text_color}`,
                      }}
                    >
                      <input
                        type="color"
                        value={form.text_color}
                        onChange={(e) =>
                          handleChange("text_color", e.target.value)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    maxLength={7}
                    value={form.text_color}
                    onChange={(e) => handleChange("text_color", e.target.value)}
                    className="w-full text-center h-9 bg-[#111827] border border-white/10 rounded-xl px-2 outline-none text-xs text-white font-mono focus:border-violet-400"
                  />
                </div>
              </div>

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

          {/* REAL-TIME PREVIEW CRUCIAL CORRECTION */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
            <div className="flex items-center gap-2 px-1 text-white/60 text-xs font-bold uppercase tracking-wider">
              <Eye size={14} /> Pré-visualização em tempo real
            </div>

            {/* Mimetiza com precisão o container principal da HomePage */}
            <div
              className="relative rounded-[32px] border border-white/10 overflow-hidden shadow-2xl scale-[0.95] origin-top min-h-[520px] flex flex-col justify-between transition-colors duration-300"
              style={{
                backgroundColor: form.background_color,
                color: form.text_color,
              }}
            >
              {/* Glow Dinâmico Traseiro (Igual ao HomePage) */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none mix-blend-screen"
                style={{
                  background: `
                    radial-gradient(circle at 15% 25%, ${form.primary_color} 0%, transparent 45%),
                    radial-gradient(circle at 85% 75%, ${form.secondary_color} 0%, transparent 45%)
                  `,
                }}
              />

              {/* BARRA DE NAVEGAÇÃO / NAV SIMULADA */}
              <div
                className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 backdrop-blur-md"
                style={{ backgroundColor: `${form.background_color}99` }}
              >
                {previewUrl || form.logo_url ? (
                  <img
                    src={previewUrl || form.logo_url}
                    alt="Logo Preview"
                    className="h-5 max-w-[100px] object-contain"
                  />
                ) : (
                  <span className="text-[11px] font-black tracking-wider uppercase opacity-60">
                    {form.name ? form.name.substring(0, 8) : "LOGO"}
                  </span>
                )}
                <div className="w-5 h-5 rounded-md bg-white/10" />
              </div>

              {/* GRID ASSIMÉTRICO (Layout simulado da HomePage em versão miniatura) */}
              <div className="relative z-10 p-6 flex-1 flex flex-col justify-center gap-6">
                {/* Lado Direito da HomePage (A Logo Centralizada com o Glassmorphic Premium) */}
                <div className="flex justify-center order-1">
                  <div className="relative w-full max-w-[140px] aspect-square flex items-center justify-center">
                    {/* Brilho da logo */}
                    <div
                      className="absolute inset-0 blur-2xl opacity-35 rounded-full transition-colors"
                      style={{ backgroundColor: form.primary_color }}
                    />

                    {/* Moldura Premium Glassmorphic */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent border border-white/[0.08] backdrop-blur-xl rounded-[24px] p-4 flex items-center justify-center shadow-xl">
                      {previewUrl || form.logo_url ? (
                        <img
                          src={previewUrl || form.logo_url}
                          alt="Logo Hero"
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-md"
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

                {/* Lado Esquerdo da HomePage (Textos Alinhados e Botões) */}
                <div className="text-center order-2">
                  <h1 className="text-2xl font-black tracking-tight leading-none mb-2 break-words">
                    {form.name || "Minha Empresa"}
                  </h1>

                  <p className="text-[12px] mb-5 line-clamp-3 max-w-[260px] mx-auto leading-relaxed opacity-70">
                    {form.about ||
                      "Bem-vindo à nossa plataforma de agendamentos e produtos."}
                  </p>

                  {/* Ações / Botões Dinâmicos */}
                  <div className="flex flex-col gap-2.5 w-full max-w-[200px] mx-auto">
                    <button
                      type="button"
                      className="h-10 px-4 rounded-xl text-xs font-bold  flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
                      style={{
                        backgroundColor: form.primary_color,
                        color: form.text_color,
                      }}
                    >
                      <Calendar size={13} />
                      Agendar Serviço
                    </button>

                    <button
                      type="button"
                      className="h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10 bg-white/5 backdrop-blur-md transition-all "
                      style={{
                        backgroundColor: form.secondary_color,
                        color: form.text_color,
                      }}
                    >
                      <ShoppingBag size={13} />
                      Ver Produtos
                    </button>
                  </div>
                </div>
              </div>

              {/* FOOTER DO PREVIEW */}
              <div
                className="relative z-10 p-2 text-center border-t border-white/5"
                style={{ backgroundColor: `${form.background_color}66` }}
              >
                <div className="text-[10px] flex items-center justify-center gap-1 opacity-40">
                  <HelpCircle size={10} /> Miniatura sincronizada com o tema
                  real
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
