// src/pages/OrderCustomColor.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useSelector, shallowEqual } from 'react-redux';
import { privateInstance } from "../../utils/apiInstances";

const OrderCustomColor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.userReducer, shallowEqual);
  const { image: referenceImage, prompt } = location.state || {};

  const [formData, setFormData] = useState({
    nama: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
    email: user?.email ?? "", // Gunakan email user
    warna: "", // Akan diisi otomatis dari prompt
    jumlah: 1,
    alamat: user?.address ?? "",
  });

  const [additionalImage, setAdditionalImage] = useState(null);
  const [additionalImagePreview, setAdditionalImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Efek untuk mengekstrak warna dari prompt saat komponen dimuat
  useEffect(() => {
    if (prompt) {
      const colorMatch = prompt.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
      if (colorMatch) {
        setFormData((prev) => ({ ...prev, warna: colorMatch[0] }));
      }
    }
  }, [prompt]);

  // Jika halaman ini diakses langsung tanpa data, kembalikan ke home
  if (!referenceImage) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => navigate("/"), [navigate]);
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdditionalImage(file);
      setAdditionalImagePreview(URL.createObjectURL(file));
    }
  };

  const toBase64 = (fileOrBlob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileOrBlob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Perbarui fungsi handleSubmit Anda menjadi seperti ini
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Konversi gambar referensi utama (yang merupakan blob URL) ke Base64
      const mainImageResponse = await fetch(referenceImage);
      const mainImageBlob = await mainImageResponse.blob();
      const mainImageBase64 = await toBase64(mainImageBlob);

      let additionalImageBase64 = null;
      // Konversi gambar tambahan (jika ada) ke Base64
      if (additionalImage) {
        additionalImageBase64 = await toBase64(additionalImage);
      }

      // Siapkan payload untuk dikirim ke backend
      const payload = {
        ...formData,
        prompt: prompt, // Pastikan prompt juga dikirim
        mainReferenceImage: mainImageBase64,
        additionalReferenceImage: additionalImageBase64,
      };

      // Kirim data ke endpoint baru Anda
      await privateInstance.post("/api/v1/orders", payload);

      // Tampilkan notifikasi sukses
      alert("Pesanan berhasil dikirim!"); // Ganti dengan sistem notifikasi Anda (misal: react-hot-toast)
      navigate("/"); // Arahkan ke halaman utama setelah berhasil
    } catch (err) {
      console.error("Failed to submit order:", err);
      alert("Gagal mengirim pesanan. Silakan coba lagi."); // Tampilkan notifikasi error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 6 } }}>
        <Box mb={5} textAlign="center">
          <Typography variant="h4" component="h2" fontWeight="bold">
            Form Pemesanan Spesial Color
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Isi detail di bawah untuk melakukan pemesanan warna kustom Anda.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box
              sx={{ mb: 2, border: "1px solid #ddd", p: 1, borderRadius: 2 }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Gambar Referensi Utama:
              </Typography>
              <img
                src={referenceImage}
                alt="Main Reference"
                style={{ width: "100%", borderRadius: "4px" }}
              />
            </Box>

            <TextField
              label="Nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Warna yang Dipesan"
              name="warna"
              value={formData.warna}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Jumlah Unit (dalam Roll)"
              name="jumlah"
              type="number"
              value={formData.jumlah}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              label="Alamat Pengiriman"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={4}
            />

            <div>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Gambar Referensi Tambahan (Opsional)
              </Typography>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
              <Box
                onClick={() => fileInputRef.current.click()}
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {additionalImagePreview ? (
                  <img
                    src={additionalImagePreview}
                    alt="Preview"
                    style={{ maxHeight: "150px", maxWidth: "100%" }}
                  />
                ) : (
                  <Stack alignItems="center" spacing={1}>
                    <AddPhotoAlternateIcon
                      color="disabled"
                      sx={{ fontSize: 40 }}
                    />
                    <Typography>Klik untuk mengunggah gambar</Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG, JPG, GIF hingga 10MB
                    </Typography>
                  </Stack>
                )}
              </Box>
            </div>

            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={2}
              justifyContent="flex-end"
              pt={2}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{ position: "relative" }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Kirim Pesanan"
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderCustomColor;
