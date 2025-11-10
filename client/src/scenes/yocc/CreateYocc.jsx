import {
  Box,
  Stack,
  CircularProgress,
  Typography,
  Button,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  MenuItem,
  Dialog,
  DialogContent,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import React, { useEffect, useState, useRef } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { setGeneratedPost } from "../../state/formSlice";
import { fetchUserPosts } from "../../state/userPostsSlice";
import { shades } from "../../theme";
import { Vibrant } from "node-vibrant/browser";
import { privateInstance } from "../../utils/apiInstances";
import ReplayIcon from "@mui/icons-material/Replay";
import DoneOutlineOutlined from "@mui/icons-material/DoneOutlineOutlined";
import giorgio from "../../assets/textures/giorgio-base.jpg";
import riders from "../../assets/textures/riders-base.jpg";
import superior from "../../assets/textures/superior-base.jpg";
import camaro from "../../assets/textures/camaro-base.jpg";

// --- Helper Component ---
const ImagePreview = ({ label, imageSrc, onClick, sx = {} }) => (
  <Box
    onClick={onClick}
    sx={{
      border: "2px dashed",
      borderColor: "grey.400",
      borderRadius: 2,
      p: 2,
      textAlign: "center",
      cursor: "pointer",
      width: "100%",
      height: "250px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "grey.50",
      transition: "background-color 0.3s",
      "&:hover": { bgcolor: "grey.100" },
      ...sx,
    }}
  >
    {imageSrc ? (
      <img
        src={imageSrc}
        alt={`${label} preview`}
        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
      />
    ) : (
      <>
        <AddPhotoAlternateIcon
          sx={{ fontSize: 40, color: "grey.500", mb: 1 }}
        />
        <Typography color="text.secondary">{label}</Typography>
      </>
    )}
  </Box>
);

const steps = ["Select Texture & Color", "Generate Your Image", "View Result"];

const CreateYocc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);

  // Tahap 1
  const [textureImageFile, setTextureImageFile] = useState(null);
  const [textureImagePreview, setTextureImagePreview] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);

  // Tahap 2
  const [baseImageFile, setBaseImageFile] = useState(null);
  const [baseImagePreview, setBaseImagePreview] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [colors, setColors] = useState(null);
  const [openAsset, setOpenAsset] = useState(false);

  // Refs input
  const textureInputRef = useRef(null);
  const baseInputRef = useRef(null);

  const TEXTURE_BASES = { giorgio, riders, superior, camaro };

  const [mode, setMode] = useState("recolor"); // "keep" | "recolor"
  const [product, setProduct] = useState("giorgio");

  const color = selectedColor || "#ffffff";
  const safeColor = /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : "#ffffff";

  const handleFileChange = (e, setImageFile, setImagePreview) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Tahap 1: upload + ekstraksi warna
  const handleTextureUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setTextureImageFile(file);
    setIsLoading(true);
    setError("");
    setColors(null);
    setSelectedColor(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgSrc = event.target && event.target.result;
      setTextureImagePreview(imgSrc);
      Vibrant.from(imgSrc)
        .getPalette()
        .then((palette) => {
          setColors({
            Vibrant: palette.Vibrant?.hex,
            DarkVibrant: palette.DarkVibrant?.hex,
            LightVibrant: palette.LightVibrant?.hex,
            Muted: palette.Muted?.hex,
          });
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error extracting colors:", err);
          setError("Could not extract colors from image.");
          setIsLoading(false);
        });
    };
    reader.readAsDataURL(file);
  };

  // Helper: ambil asset base texture sebagai File (untuk FormData)
  async function assetToFile(url, filename) {
    const res = await fetch(url);
    const blob = await res.blob();
    const type = blob.type || "image/jpeg";
    return new File([blob], filename, { type });
  }

  const handleNext = async () => {
    if (activeStep === 0) {
      const newPrompt =
        "Strictly follow these instructions. You are an expert photo editor. " +
        "Your only output must be the edited image, with no accompanying text. " +
        "From the first image provided (the base image), identify the main seating object (sofa, chair, or bench). " +
        "Replace the texture of ONLY that seating object with the texture from the second image provided. " +
        `The color of the new texture must be precisely ${safeColor}. ` +
        "Maintain the original shape, folds, lighting, and shadows of the seating object perfectly. " +
        "All other elements in the room must remain completely unchanged.";
      setPrompt(newPrompt);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTextureImageFile(null);
    setTextureImagePreview("");
    setSelectedColor(null);
    setBaseImageFile(null);
    setBaseImagePreview("");
    setPrompt("");
    setGeneratedImage(null);
    setIsLoading(false);
    setError("");
    setColors(null);
    setMode("recolor");
    setProduct("giorgio");
  };

  const handleFinish = () => {
    if (!generatedImage) return;
    const newId = uuidv4();
    const newPost = { id: newId, image: generatedImage, prompt };
    dispatch(setGeneratedPost(newPost));
    navigate(`/search/single/${newId}`);
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!baseImageFile || !selectedColor) {
      setError("Please select base image and color.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");

      let textureFileToSend = null;

      if (mode === "keep") {
        if (!textureImageFile) {
          setError("Texture reference (uploaded) is missing.");
          setIsLoading(false);
          return;
        }
        textureFileToSend = textureImageFile;
      } else {
        const assetUrl = TEXTURE_BASES[product];
        textureFileToSend = await assetToFile(assetUrl, `${product}-base.jpg`);
      }

      const formData = new FormData();
      formData.append("baseImage", baseImageFile);
      formData.append("textureImage", textureFileToSend);
      formData.append("prompt", prompt);
      formData.append("hex", safeColor);
      formData.append("mode", mode);
      formData.append("product", product);

      const response = await privateInstance.post(
        "/api/v1/dalle/edit-with-texture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
        }
      );
      const imageUrl = URL.createObjectURL(response.data);
      setGeneratedImage(imageUrl);
      setActiveStep(2);
    } catch (err) {
      console.error("Image generation failed:", err);
      setError(
        "Failed to generate image. The model may not support this request. Please try a different image or prompt."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={{ xs: "20px 5%", md: "50px 10%" }}>
      <Typography variant="h3" textAlign="center" fontWeight="bold" mb={1}>
        Make Your Imagination Come True
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ======================= LANGKAH 1 ======================= */}
      {activeStep === 0 && (
        <Stack spacing={4} alignItems="center">
          <input
            type="file"
            ref={textureInputRef}
            onChange={handleTextureUpload}
            accept="image/*"
            style={{ display: "none" }}
          />
          <ImagePreview
            label="1. Upload Your Reference (logo/foto/texture)"
            imageSrc={textureImagePreview}
            onClick={() =>
              textureInputRef.current && textureInputRef.current.click()
            }
            sx={{ maxWidth: "400px" }}
          />

          {isLoading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}

          {colors && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                2. Select a Color
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {Object.entries(colors).map(
                  ([name, color]) =>
                    color && (
                      <Grid item key={name}>
                        <Box
                          onClick={() => setSelectedColor(color)}
                          sx={{
                            width: 80,
                            height: 80,
                            backgroundColor: color,
                            borderRadius: 2,
                            cursor: "pointer",
                            border:
                              selectedColor === color
                                ? `4px solid ${shades.primary[500]}`
                                : "2px solid #ccc",
                            boxShadow: 3,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.1)" },
                          }}
                        />
                        <Typography variant="caption" display="block" mt={1}>
                          {color}
                        </Typography>
                      </Grid>
                    )
                )}
              </Grid>
            </Box>
          )}

          {selectedColor && (
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              sx={{ minWidth: 150 }}
            >
              Next
            </Button>
          )}
        </Stack>
      )}

      {/* ======================= LANGKAH 2 ======================= */}
      {activeStep === 1 && (
        <form onSubmit={handleGenerateSubmit}>
          <Stack spacing={4} alignItems="center">
            <Typography variant="h6" gutterBottom>
              Upload the image you want to edit
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              justifyContent="center"
              width="100%"
            >
              {/* Base image */}
              <Box>
                <input
                  type="file"
                  ref={baseInputRef}
                  onChange={(e) =>
                    handleFileChange(e, setBaseImageFile, setBaseImagePreview)
                  }
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <ImagePreview
                  label="Upload Base Image (e.g., Sofa)"
                  imageSrc={baseImagePreview}
                  onClick={() =>
                    baseInputRef.current && baseInputRef.current.click()
                  }
                />
              </Box>

              {/* Texture preview with mode & product */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  width: "100%",
                  maxWidth: "300px",
                  height: "250px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Mode buttons */}
                <Box display="flex" gap={1} mb={1}>
                  <Button
                    size="small"
                    fullWidth
                    variant={mode === "keep" ? "contained" : "outlined"}
                    onClick={() => setMode("keep")}
                  >
                    Gambar
                  </Button>
                  <Button
                    size="small"
                    fullWidth
                    variant={mode === "recolor" ? "contained" : "outlined"}
                    onClick={() => setMode("recolor")}
                  >
                    Produk
                  </Button>
                </Box>

                {mode === "recolor" && (
                  <TextField
                    select
                    size="small"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    sx={{ mb: 1 }}
                  >
                    <MenuItem value="giorgio">Giorgio</MenuItem>
                    <MenuItem value="riders">Riders</MenuItem>
                    <MenuItem value="superior">New Superior</MenuItem>
                    <MenuItem value="camaro">Camaro</MenuItem>
                  </TextField>
                )}

                <Typography variant="body2" mt={0.5}>
                  Texture Reference:
                </Typography>

                {/* Preview tanpa tint (klik untuk popup asset saat Produk) */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 1,
                    border: "1px solid #ddd",
                    mt: 0.5,
                    bgcolor: "white",
                    position: "relative",
                    cursor:
                      mode === "recolor" ||
                      (mode === "keep" && !!textureImagePreview)
                        ? "zoom-in"
                        : "default",
                  }}
                  onClick={() => {
                    // buka popup kalau ada sumber gambar yang valid
                    if (
                      mode === "recolor" ||
                      (mode === "keep" && !!textureImagePreview)
                    ) {
                      setOpenAsset(true);
                    }
                  }}
                >
                  <Box
                    component="img"
                    key={`${mode}-${product}`}
                    src={
                      mode === "keep"
                        ? textureImagePreview
                        : TEXTURE_BASES[product]
                    }
                    alt="Texture Preview"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      backgroundColor: "#fff",
                      filter:
                        mode === "recolor"
                          ? "grayscale(1) brightness(1) contrast(1)"
                          : "none",
                    }}
                  />
                </Box>

                <Typography variant="body2" mt={1}>
                  Selected Color:
                </Typography>
                <Box display="flex" alignItems="center" mt={0.5}>
                  <Box
                    component="span"
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: safeColor,
                      border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: "4px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" fontFamily="monospace">
                    {safeColor}
                  </Typography>
                </Box>
              </Paper>
            </Stack>

            <TextField
              label="Prompt"
              multiline
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ maxWidth: "660px" }}
              InputProps={{ readOnly: true }}
            />

            {error && (
              <Alert severity="error" sx={{ width: "100%", maxWidth: "660px" }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading || !baseImageFile}
                sx={{ minWidth: "200px", height: "50px" }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Generate Image"
                )}
              </Button>
            </Stack>
          </Stack>
        </form>
      )}

      {/* ======================= LANGKAH 3 ======================= */}
      {activeStep === 2 && (
        <Stack spacing={3} alignItems="center">
          <Typography variant="h5" gutterBottom>
            Generation Successful!
          </Typography>
          <Box
            component="img"
            src={generatedImage}
            alt="Generated result"
            sx={{
              width: "100%",
              maxWidth: 800,
              height: "auto",
              borderRadius: 2,
              boxShadow: 5,
            }}
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ReplayIcon />}
              onClick={handleReset}
            >
              Buat Ulang Gambar
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<DoneOutlineOutlined />}
              onClick={handleFinish}
            >
              Selesai
            </Button>
          </Stack>
        </Stack>
      )}

      {/* === Popup asset produk === */}
      <Dialog
        open={openAsset}
        onClose={() => setOpenAsset(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
          <Box
            component="img"
            src={
              mode === "recolor" ? TEXTURE_BASES[product] : textureImagePreview
            }
            alt={`${mode === "recolor" ? product : "uploaded"} texture`}
            sx={{ width: "100%", height: "auto", display: "block" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CreateYocc;
