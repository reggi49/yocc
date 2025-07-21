import {
  Box,
  CircularProgress,
  styled,
  Typography,
  useMediaQuery,
  Button,
} from "@mui/material";
import React from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { FlexBox } from "../../components/FlexBox";
import { shades } from "../../theme";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { downloadImage, STATUS } from "../../utils";
import { createPost } from "../../state/postsSlice";
import DDButton from "./DDButton";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Import ikon baru

const SingleImageDashboard = () => {
  const isMobile = useMediaQuery("(max-width:767px)");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { formReducer, postsReducer } = useSelector(
    (state) => state,
    shallowEqual
  );
  const { posts } = formReducer;
  const { status } = postsReducer;

  const { id } = useParams();

  let { image, prompt } = posts.find((node) => node.id == id);

  const shareBtnlabel =
    "Once you've created the image you want, you can share it with others in the community";
  
  const handleOrder = () => {
    // Navigasi ke halaman form pemesanan, sambil mengirim data gambar dan prompt
    navigate("/order", {
      state: {
        image,
        prompt,
      },
    });
  };

  const handleShare = async () => {
    // 1. Jadikan fungsi ini 'async'
    // Hanya konversi jika 'image' adalah blob URL
    if (image.startsWith("blob:")) {
      try {
        console.log("Converting blob URL to Base64 for sharing...");
        // 2. Tunggu proses konversi selesai
        const imageAsBase64 = await blobUrlToBase64(image);

        // 3. Kirim data Base64 ke Redux
        const args = { image: imageAsBase64, prompt };
        dispatch(createPost(args));
        console.log("Dispatching createPost with Base64 data.");
      } catch (err) {
        console.error("Failed to convert image for sharing:", err);
        // Tampilkan error ke pengguna jika perlu
      }
    } else {
      // Jika 'image' sudah dalam format lain (misalnya URL dari Cloudinary),
      // langsung kirim saja.
      const args = { image, prompt };
      dispatch(createPost(args));
    }
  };

  const handleDownload = () => {
    downloadImage({ id, url: image });
  };

  const blobUrlToBase64 = async (blobUrl) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };

  return (
    <Box
      // border={1}
      display="flex"
      flexDirection="column"
      p={{ xs: "15px 5%", md: "30px 5%" }}
      minHeight="calc(100vh - 70px)"
    >
      <FlexBox mb={{ xs: "15px", md: "30px" }} justifyContent="space-between">
        {/* back */}
        <FlexBox
          onClick={() => navigate("/search")}
          sx={{
            transition: "0.2s",
            fontWeight: "bold",
            borderRadius: "5px",
            columnGap: "5px",
            p: `${isMobile ? "10px 0" : "10px"}`,
            cursor: "pointer",
            ":hover": {
              background: `${!isMobile && `${shades.secondary[300]}`}`,
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: "15px" }} />
          Back
        </FlexBox>

        {/* Share/download desktop version */}
        <FlexBox columnGap="10px">
          {!isMobile && (
            <>
              <Btn onClick={handleDownload}>
                <FileDownloadOutlinedIcon />
              </Btn>
              <Btn onClick={handleOrder}>
                <ShoppingCartIcon sx={{ mr: 1 }} />
                Pesan
              </Btn>
              <Box title={shareBtnlabel} position="relative">
                <Btn disabled={status === STATUS.LOADING} onClick={handleShare}>
                  Share with community
                </Btn>
                {status === STATUS.LOADING && (
                  <CircularProgress
                    size={18}
                    sx={{
                      position: "absolute",
                      color: "#1d2226",
                      left: "50%",
                      top: "50%",
                      mt: "-11px",
                      ml: "-9px",
                    }}
                  />
                )}
              </Box>
            </>
          )}
          <DDButton {...{ image, prompt }} />
        </FlexBox>
      </FlexBox>
      <Outlet />

      {isMobile && (
        <Typography variant="small" color={shades.primary[300]}>
          Once you've created the image you want, you can share it with others
          in the community
        </Typography>
      )}

      {/* download and share button for mobile sscreen */}
      {isMobile && (
        <FlexBox pt="30px" mt="auto" columnGap="10px">
          <Box flex={1}>
            <Btn fullWidth mobile={isMobile.toString()} onClick={handleOrder}>
              Pesan
            </Btn>
          </Box>
          <Box flex={1}>
            <Btn
              fullWidth
              mobile={isMobile.toString()}
              onClick={handleDownload}
            >
              Download
            </Btn>
          </Box>
          <Box flex={1} title={shareBtnlabel} position="relative">
            <Btn
              fullWidth
              mobile={isMobile.toString()}
              disabled={status === STATUS.LOADING}
              onClick={handleShare}
            >
              Share
            </Btn>
            {status === STATUS.LOADING && (
              <CircularProgress
                size={18}
                sx={{
                  position: "absolute",
                  color: "#1d2226",
                  left: "50%",
                  top: "50%",
                  mt: "-10px",
                  ml: "-9px",
                }}
              />
            )}
          </Box>
        </FlexBox>
      )}
    </Box>
  );
};

export default SingleImageDashboard;

const Btn = styled(Button)(({ mobile }) => ({
  fontWeight: "bold",
  transition: "0.2s",
  minWidth: 0,
  padding: `${mobile === "true" ? "20px" : "8px 12px"}`,
  background: `${shades.secondary[300]}`,
  borderRadius: "5px",
  ":hover": {
    background: `${shades.secondary[100]}`,
  },
}));
