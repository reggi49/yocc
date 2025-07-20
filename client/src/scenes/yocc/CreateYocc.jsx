import {
  Box,
  Stack,
  CircularProgress,
  Typography,
  Button,
  useMediaQuery,
  IconButton,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import React, { useContext, useEffect, useState, useRef } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Posts from "../../components/Posts";
import { fetchUserPosts } from "../../state/userPostsSlice";
import { backdropContext } from "../../context/BackdropContext";
import { shades } from "../../theme";
import { FlexBox } from "../../components/FlexBox";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { Vibrant } from "node-vibrant/browser";
import { privateInstance } from "../../utils/apiInstances";
import Input from "../../components/Input";

const Loader = () => (
  <Stack p="40px 0 10px" alignItems="center">
    <CircularProgress size={25} />
  </Stack>
);

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
      "&:hover": {
        bgcolor: "grey.100",
      },
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

const steps = ["Select Texture & Color", "Edit Your Image"];

const CreateYocc = () => {
  const isMobile = useMediaQuery("(max-width:767px)");
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { toggleBackdrop } = useContext(backdropContext);
  const [notInitRender, setNotInitRender] = useState(false);
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [colors, setColors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [showReferenceSection, setShowReferenceSection] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [baseImageFile, setBaseImageFile] = useState(null);
  const [textureImageFile, setTextureImageFile] = useState(null);
  const [baseImagePreview, setBaseImagePreview] = useState("");
  const [textureImagePreview, setTextureImagePreview] = useState("");
  const [prompt, setPrompt] = useState(
    "Strictly follow these instructions. You are an image editing tool. Your only output must be the edited image, with no accompanying text, comments, or explanations. Using the first image provided (the base image), replace the texture of the sofa with the texture from the second image provided. Maintain the original shape, lighting, shadows, and perspective perfectly. The rest of the scene must remain unchanged."
  );
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Refs untuk input file
  const baseImageRef = useRef(null);
  const textureImageRef = useRef(null);
  const textureInputRef = useRef(null);
  const baseInputRef = useRef(null);

  const handleTextureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTextureImageFile(file);
    setIsExtracting(true);
    setColors(null);
    setSelectedColor(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgSrc = event.target.result;
      setTextureImagePreview(imgSrc);
      extractColors(imgSrc);
    };
    reader.readAsDataURL(file);
  };

  const extractColors = (imgSrc) => {
    Vibrant.from(imgSrc)
      .getPalette()
      .then((palette) => {
        setColors({
          Vibrant: palette.Vibrant?.hex,
          DarkVibrant: palette.DarkVibrant?.hex,
          LightVibrant: palette.LightVibrant?.hex,
          Muted: palette.Muted?.hex,
          DarkMuted: palette.DarkMuted?.hex,
          LightMuted: palette.LightMuted?.hex,
        });
        setIsExtracting(false);
      })
      .catch((err) => {
        console.error("Error extracting colors:", err);
        setError("Could not extract colors from this image.");
        setIsExtracting(false);
      });
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  const handleNextStep = () => {
    // Siapkan prompt untuk langkah kedua
    const newPrompt = `Strictly follow these instructions. You are an expert photo editor. Your only output must be the edited image, with no accompanying text or explanation. From the first image provided (the base image), identify the main seating object (sofa, chair, or bench). Replace the texture of ONLY that seating object with the texture from the second image provided. The color of the new texture must be precisely ${selectedColor}. Maintain the original shape, folds, lighting, and shadows of the seating object perfectly. All other elements in the room must remain completely unchanged.`;
    setPrompt(newPrompt);
    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFileChange = (e, setImageFile, setImagePreview) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseImageFile || !textureImageFile || !prompt) {
      setError("Please provide a base image, a texture image, and a prompt.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGeneratedImage(null);

    const formData = new FormData();
    formData.append("baseImage", baseImageFile);
    formData.append("textureImage", textureImageFile);
    formData.append("prompt", prompt);

    try {
      // Pastikan nama endpoint ini benar
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
    } catch (err) {
      console.error("Image generation failed:", err);
      setError(
        "Failed to generate image. Please check server logs for details."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box p={{ xs: "20px 5%", md: "50px 10%" }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" mb={1}>
        AI Image Editor
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ======================= LANGKAH 1: PILIH WARNA ======================= */}
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
            label="Upload Texture / Reference Image"
            imageSrc={textureImagePreview}
            onClick={() => textureInputRef.current.click()}
            sx={{ maxWidth: "400px" }}
          />

          {isExtracting && <CircularProgress />}

          {colors && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Select a Color
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {Object.entries(colors).map(
                  ([name, color]) =>
                    color && (
                      <Grid item key={name}>
                        <Box
                          onClick={() => handleColorSelect(color)}
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
            <Button variant="contained" size="large" onClick={handleNextStep}>
              Next
            </Button>
          )}
        </Stack>
      )}

      {/* ======================= LANGKAH 2: EDIT GAMBAR ======================= */}
      {activeStep === 1 && (
        <form onSubmit={handleSubmit}>
          <Stack spacing={4} alignItems="center">
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              justifyContent="center"
              width="100%"
            >
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
                  onClick={() => baseInputRef.current.click()}
                />
              </Box>
              <Box>
                <ImagePreview
                  label="Texture Reference"
                  imageSrc={textureImagePreview}
                  onClick={() => {}} // Tidak bisa diubah di langkah ini
                  sx={{ cursor: "default", "&:hover": { bgcolor: "grey.50" } }}
                />
                <Typography variant="body2" mt={1}>
                  Color:
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      width: 16,
                      height: 16,
                      bgcolor: selectedColor,
                      verticalAlign: "middle",
                      ml: 1,
                      border: "1px solid black",
                    }}
                  />
                  <Box component="span" sx={{ ml: 1, verticalAlign: "middle" }}>
                    {selectedColor}
                  </Box>
                </Typography>
              </Box>
            </Stack>

            <TextField
              label="Prompt (Auto-generated)"
              multiline
              rows={8}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ maxWidth: "624px" }}
              InputProps={{ readOnly: true }}
            />

            {error && (
              <Alert severity="error" sx={{ width: "100%", maxWidth: "624px" }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleBackStep}>
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isGenerating || !baseImageFile}
                sx={{ minWidth: "200px", height: "50px" }}
              >
                {isGenerating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Generate Image"
                )}
              </Button>
            </Stack>

            {generatedImage && (
              <Box mt={4} textAlign="center">
                <Typography variant="h5" gutterBottom>
                  Generated Image
                </Typography>
                <Box
                  component="img"
                  src={generatedImage}
                  alt="Generated result"
                  sx={{
                    width: "100%",
                    maxWidth: 700,
                    height: "auto",
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                />
              </Box>
            )}
          </Stack>
        </form>
      )}
    </Box>
  );
};

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setIsLoading(true);
//     setColors(null);

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const img = new Image();
//       img.onload = () => {
//         setImage(img.src);
//         extractColors(img);
//       };
//       img.src = event.target.result;
//     };
//     reader.readAsDataURL(file);
//   };

// const extractColors = (img) => {
//   Vibrant.from(img)
//     .getPalette()
//     .then((palette) => {
//       setColors({
//         Alternatif: palette.Vibrant?.hex,
//         darkVibrant: palette.DarkVibrant?.hex,
//         lightVibrant: palette.LightVibrant?.hex,
//         muted: palette.Muted?.hex,
//         darkMuted: palette.DarkMuted?.hex,
//         lightMuted: palette.LightMuted?.hex,
//       });
//       setIsLoading(false);
//     })
//     .catch((err) => {
//       console.error("Error extracting colors:", err);
//       setIsLoading(false);
//     });
// };

//   const triggerFileInput = () => {
//     fileInputRef.current.click();
//   };
//   const {
//     userPosts: posts,
//     status,
//     totalPages,
//   } = useSelector((state) => state.userPostsReducer, shallowEqual);

//   const handleColorSelect = (color) => {
//     setSelectedColor(color); // Save for next process
//     console.log("Selected color:", color);
//   };

//   const referenceInputRef = useRef(null);
//   const triggerReferenceInput = () => {
//     referenceInputRef.current.click();
//   };

//   const handleReferenceUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       setReferenceImage(event.target.result);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleProceedImage = async () => {
//     console.log("Proceeding with image:", referenceImage);
//     try {
//       privateInstance
//         .post("/api/v1/dalle/describe", {
//           base64Image: referenceImage,
//           color: selectedColor,
//         }) // full base64 string
//         .then((res) => {
//           const description = res?.data?.result;
//           // const data = description.json();
//           setGeneratedPrompt(description);
//           // setGeneratedPrompt(data);
//           console.log("AI Description:", description);
//           // console.log("Data Description:", data);
//           //  dispatch(setStatus(STATUS.IDLE));
//         })
//         .catch((err) => {
//           console.error("Failed to describe image:", err);
//           //  dispatch(setStatus(STATUS.ERROR));
//         });
//     } catch (err) {
//       console.error("Error:", err?.response?.data || err.message);
//       // return next(CustomErrorHandler.serverError("Image description failed."));
//     }
//   };

//   const { user } = useSelector((state) => state.userReducer, shallowEqual);
//   useEffect(() => {
//     dispatch(
//       fetchUserPosts({
//         userId: user?._id,
//         page,
//         toggleBackdrop,
//         concat: notInitRender,
//       })
//     );
//     setNotInitRender(true);
//   }, [page]);

//   // const images = [
//   //   "https://res.cloudinary.com/kodepintar/image/upload/v1746524148/na0eqneyx46im9paoskw.png",
//   // ];

//   return (
//     <Box padding={{ xs: "20px 5%", md: "50px 5%" }} textAlign="center">
// <Typography mb="5px" fontSize="20px">
//   Color Extraction With Your Reference Image
// </Typography>
// <Typography
//   my="30px"
//   variant="small"
//   color={shades.primary[300]}
//   textAlign="center"
// >
//   Create imaginative and visually stunning images through YOCC and share
//   them with the community.
// </Typography>

// <Box className="app">
//   <div className="upload-section">
//     <input
//       type="file"
//       ref={fileInputRef}
//       onChange={handleImageUpload}
//       accept="image/*"
//       style={{ display: "none" }}
//     />
//     <button onClick={triggerFileInput} className="upload-btn">
//       Upload Image
//     </button>

//     {isLoading && <div className="loading">Processing image...</div>}
//   </div>

//   {image && (
//     <div className="image-section">
//       <h2>Uploaded Image</h2>
//       <div className="image-container">
//         <img
//           src={image}
//           alt="Uploaded preview"
//           className="preview-image"
//         />
//       </div>
//     </div>
//   )}

//   {colors && (
//     <Box className="colors-section">
//       <h2>Dominant Colors</h2>
//       {/* <div className="color-palette"> */}
//       <Box
//         component="ul"
//         className="palette"
//         sx={{
//           display: "flex",
//           listStyle: "none",
//           mt: 2,
//           p: 0,
//           cursor: "pointer",
//           justifyContent: "center",
//         }}
//       >
//         {Object.entries(colors).map(
//           ([name, color]) =>
//             color && (
//               <Box
//                 key={name}
//                 component="li"
//                 className="palette__item"
//                 sx={{
//                   mx: 1,
//                 }}
//                 onClick={() => {
//                   handleColorSelect(color);
//                   setShowReferenceSection(true);
//                 }}
//                 // onClick={() => handleColorSelect(color)} // Capture selected color
//               >
//                 <Box
//                   className="palette__inner"
//                   sx={{
//                     position: "relative",
//                     p: 2,
//                     border: "1px solid #ccc",
//                     borderRadius: 2,
//                   }}
//                 >
//                   <Box
//                     className="palette__fill"
//                     sx={{
//                       width: 80,
//                       height: 80,
//                       backgroundColor: color,
//                       mb: 1,
//                     }}
//                   />
//                   {/* <Colorize className="icon" /> */}
//                   <Box className="palette__name">
//                     {/* <Typography
//                       className="palette__value palette__value--default"
//                       variant="caption"
//                     >
//                       {name}
//                     </Typography> */}
//                     <br />
//                     <Typography
//                       fontSize="16px"
//                       className="palette__value palette__value--real"
//                       variant="caption"
//                     >
//                       {color}
//                     </Typography>
//                   </Box>
//                 </Box>
//               </Box>

//                     // <div key={name} className="color-item">
//                     //   <div
//                     //     className="color-box"
//                     //     style={{ backgroundColor: color }}
//                     //   ></div>
//                     //   <div className="color-info">
//                     //     <span className="color-name">{name}</span>
//                     //     <span className="color-value">{color}</span>
//                     //   </div>
//                     // </div>
//                   )
//               )}
//             </Box>
//           </Box>
//         )}
//       </Box>
//       {showReferenceSection && (
//         <Box mt={4} textAlign="center">
//           <Typography variant="h6" gutterBottom>
//             Image References
//           </Typography>

//           <input
//             type="file"
//             ref={referenceInputRef}
//             onChange={handleReferenceUpload}
//             accept="image/*"
//             style={{ display: "none" }}
//           />

//           {!referenceImage ? (
//             <Button variant="contained" onClick={triggerReferenceInput}>
//               Upload Reference Image
//             </Button>
//           ) : (
//             <Box>
//               <Box
//                 component="img"
//                 src={referenceImage}
//                 alt="Reference"
//                 sx={{
//                   width: { xs: "100%", sm: "auto" },
//                   maxHeight: 300,
//                   objectFit: "contain",
//                   borderRadius: 2,
//                   mt: 2,
//                   boxShadow: 3,
//                 }}
//               />
//               <Box mt={2}>
//                 <Button
//                   variant="contained"
//                   color="primary"
//                   onClick={handleProceedImage}
//                 >
//                   Proceed Image
//                 </Button>
//                 {/* <Typography mb="5px" fontSize="20px">
//                   {generatedPrompt}
//                 </Typography> */}
//               </Box>
//             </Box>
//           )}
//           {!referenceImage ? (
//             <></>
//           ) : (
//             // <Button variant="contained" onClick={triggerReferenceInput}>
//             //   Generate Image
//             // </Button>
//             <>
//               <br></br>
//               <Input gprompt={generatedPrompt} />
//             </>
//           )}
//         </Box>
//       )}
//     </Box>
//   );
// };

export default CreateYocc;
