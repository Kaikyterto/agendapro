const API_URL = "https://agendapro-z63z.onrender.com";

// =========================================================
// PARSE RESPONSE
// =========================================================
const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
};

// =========================================================
// UPLOAD IMAGE
// =========================================================
export const uploadImage = async (file, folder) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(response);

  // ==========================================
  // TRATAMENTO DE ERROS
  // ==========================================
  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        data?.msg ||
        "Erro ao fazer upload da imagem"
    );
  }

  return data?.data;
};
