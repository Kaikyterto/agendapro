import { apiFetch } from "./api";

export const uploadImage = async (file, folder) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", folder);

  const { data } = await apiFetch.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.data;
};
