import api from "./api";

export const uploadImage = async (file, folder) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", folder);

  const { data } = await api.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.data;
};
