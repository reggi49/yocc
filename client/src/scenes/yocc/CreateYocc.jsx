import {
  Box,
  Stack,
  CircularProgress,
  Typography,
  Button,
  useMediaQuery,
  IconButton,
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

const ImagePreview = ({ label, imageSrc, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      border: "2px dashed grey",
      borderRadius: 2,
      p: 2,
      textAlign: "center",
      cursor: "pointer",
      width: "100%",
      maxWidth: "300px",
      height: "200px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "action.hover",
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
        <AddPhotoAlternateIcon sx={{ fontSize: 40, color: "grey.500" }} />
        <Typography color="text.secondary">{label}</Typography>
      </>
    )}
  </Box>
);


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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setColors(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img.src);
        extractColors(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const extractColors = (img) => {
    Vibrant.from(img)
      .getPalette()
      .then((palette) => {
        setColors({
          Alternatif: palette.Vibrant?.hex,
          darkVibrant: palette.DarkVibrant?.hex,
          lightVibrant: palette.LightVibrant?.hex,
          muted: palette.Muted?.hex,
          darkMuted: palette.DarkMuted?.hex,
          lightMuted: palette.LightMuted?.hex,
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error extracting colors:", err);
        setIsLoading(false);
      });
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  const {
    userPosts: posts,
    status,
    totalPages,
  } = useSelector((state) => state.userPostsReducer, shallowEqual);

  const handleColorSelect = (color) => {
    setSelectedColor(color); // Save for next process
    console.log("Selected color:", color);
  };

  const referenceInputRef = useRef(null);
  const triggerReferenceInput = () => {
    referenceInputRef.current.click();
  };

  const handleReferenceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProceedImage = async () => {
    console.log("Proceeding with image:", referenceImage);
    try {
      privateInstance
        .post("/api/v1/dalle/describe", {
          base64Image: referenceImage,
          color: selectedColor,
        }) // full base64 string
        .then((res) => {
          const description = res?.data?.result;
          // const data = description.json();
          setGeneratedPrompt(description);
          // setGeneratedPrompt(data);
          console.log("AI Description:", description);
          // console.log("Data Description:", data);
          //  dispatch(setStatus(STATUS.IDLE));
        })
        .catch((err) => {
          console.error("Failed to describe image:", err);
          //  dispatch(setStatus(STATUS.ERROR));
        });
    } catch (err) {
      console.error("Error:", err?.response?.data || err.message);
      // return next(CustomErrorHandler.serverError("Image description failed."));
    }

  };

  const { user } = useSelector((state) => state.userReducer, shallowEqual);
  useEffect(() => {
    dispatch(
      fetchUserPosts({
        userId: user?._id,
        page,
        toggleBackdrop,
        concat: notInitRender,
      })
    );
    setNotInitRender(true);
  }, [page]);

  // const images = [
  //   "https://res.cloudinary.com/kodepintar/image/upload/v1746524148/na0eqneyx46im9paoskw.png",
  // ];

  return (
    <Box padding={{ xs: "20px 5%", md: "50px 5%" }} textAlign="center">
      <Typography mb="5px" fontSize="20px">
        Color Extraction With Your Reference Image
      </Typography>
      <Typography
        my="30px"
        variant="small"
        color={shades.primary[300]}
        textAlign="center"
      >
        Create imaginative and visually stunning images through YOCC and share
        them with the community.
      </Typography>

      <Box className="app">
        <div className="upload-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: "none" }}
          />
          <button onClick={triggerFileInput} className="upload-btn">
            Upload Image
          </button>

          {isLoading && <div className="loading">Processing image...</div>}
        </div>

        {image && (
          <div className="image-section">
            <h2>Uploaded Image</h2>
            <div className="image-container">
              <img
                src={image}
                alt="Uploaded preview"
                className="preview-image"
              />
            </div>
          </div>
        )}

        {colors && (
          <Box className="colors-section">
            <h2>Dominant Colors</h2>
            {/* <div className="color-palette"> */}
            <Box
              component="ul"
              className="palette"
              sx={{
                display: "flex",
                listStyle: "none",
                mt: 2,
                p: 0,
                cursor: "pointer",
                justifyContent: "center",
              }}
            >
              {Object.entries(colors).map(
                ([name, color]) =>
                  color && (
                    <Box
                      key={name}
                      component="li"
                      className="palette__item"
                      sx={{
                        mx: 1,
                      }}
                      onClick={() => {
                        handleColorSelect(color);
                        setShowReferenceSection(true);
                      }}
                      // onClick={() => handleColorSelect(color)} // Capture selected color
                    >
                      <Box
                        className="palette__inner"
                        sx={{
                          position: "relative",
                          p: 2,
                          border: "1px solid #ccc",
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          className="palette__fill"
                          sx={{
                            width: 80,
                            height: 80,
                            backgroundColor: color,
                            mb: 1,
                          }}
                        />
                        {/* <Colorize className="icon" /> */}
                        <Box className="palette__name">
                          {/* <Typography
                            className="palette__value palette__value--default"
                            variant="caption"
                          >
                            {name}
                          </Typography> */}
                          <br />
                          <Typography
                            fontSize="16px"
                            className="palette__value palette__value--real"
                            variant="caption"
                          >
                            {color}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    // <div key={name} className="color-item">
                    //   <div
                    //     className="color-box"
                    //     style={{ backgroundColor: color }}
                    //   ></div>
                    //   <div className="color-info">
                    //     <span className="color-name">{name}</span>
                    //     <span className="color-value">{color}</span>
                    //   </div>
                    // </div>
                  )
              )}
            </Box>
          </Box>
        )}
      </Box>
      {showReferenceSection && (
        <Box mt={4} textAlign="center">
          <Typography variant="h6" gutterBottom>
            Image References
          </Typography>

          <input
            type="file"
            ref={referenceInputRef}
            onChange={handleReferenceUpload}
            accept="image/*"
            style={{ display: "none" }}
          />

          {!referenceImage ? (
            <Button variant="contained" onClick={triggerReferenceInput}>
              Upload Reference Image
            </Button>
          ) : (
            <Box>
              <Box
                component="img"
                src={referenceImage}
                alt="Reference"
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 2,
                  mt: 2,
                  boxShadow: 3,
                }}
              />
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProceedImage}
                >
                  Proceed Image
                </Button>
                {/* <Typography mb="5px" fontSize="20px">
                  {generatedPrompt}
                </Typography> */}
              </Box>
            </Box>
          )}
          {!referenceImage ? (
            <></>
            // <Button variant="contained" onClick={triggerReferenceInput}>
            //   Generate Image
            // </Button>
          ) : (
            <><br></br><Input gprompt={generatedPrompt} /></>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CreateYocc;
