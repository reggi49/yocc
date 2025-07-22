import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material";
import React from "react";
import { FlexBox } from "../../components/FlexBox";
import { shades } from "../../theme";
import Input from "../../components/Input";
import Posts from "../../components/Posts";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { getRandomPrompt } from "../../utils/getRandomPrompt";
import { updateForm } from "../../state/formSlice";
import PaginationBtns from "./PaginationBtns";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";

const Home = () => {
  const isMobile = useMediaQuery("(max-width:767px)");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { posts, status } = useSelector(
    (state) => state.postsReducer,
    shallowEqual
  );
  const { user } = useSelector((state) => state.userReducer, shallowEqual);

  const handleSurpriseMe = () => {
    const randomPrompt = getRandomPrompt();
    dispatch(updateForm({ prompt: randomPrompt }));
  };

  return (
    <Box padding={{ xs: "20px 5%", md: "50px 5%" }}>
      {!user && (
        <Stack
          textAlign="center"
          alignItems="center"
          maxWidth="700px"
          minWidth="320px"
          p="20px 20px 30px"
          m="0 auto"
          sx={{
            borderRadius: "15px",
            boxShadow:
              "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset",
          }}
        >
          <Typography fontSize="20px">
            Selamat datang! Wujudkan Imajinasimu.
          </Typography>
          <Typography mt="20px">
            Untuk membuat gambar yang imajinatif dan menakjubkan secara visual
            menggunakan YOCC, silakan masuk ke akun Anda. Setelah masuk, Anda
            akan memiliki akses ke alat pembuatan gambar kami dan dapat membuat,
            berbagi, serta menyimpan gambar Anda sendiri untuk penggunaan di
            masa mendatang.
          </Typography>
          <Typography fontWeight={500} mb="20px" mt="5px">
            <b>Mari kita mulai dan wujudkan kreativitas Anda!</b>
          </Typography>
          <Button
            sx={{ p: "10px 30px" }}
            onClick={() => navigate("/signin")}
            variant="contained"
          >
            SIGN IN to create
          </Button>
        </Stack>
      )}

      {/* Heading */}
      {!!user && (
        <Box
          sx={{
            textAlign: "center",
            py: { xs: 6, md: 10 }, // Padding vertikal lebih besar
            px: 2,
            backgroundColor: shades.secondary[100], // Warna latar belakang lembut
            borderRadius: 3,
            border: `1px solid ${shades.secondary[200]}`,
          }}
        >
          <Stack spacing={2} alignItems="center">
            {/* Judul Utama */}
            <Typography
              variant="h2"
              component="h1"
              fontWeight="bold"
              color="primary.main"
              sx={{
                fontSize: { xs: "2.5rem", md: "3.5rem" },
              }}
            >
              Make Your Dreams Come True
            </Typography>

            {/* Sub-judul Deskriptif */}
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: "600px",
                mb: 3, // Margin bawah untuk memberi ruang sebelum tombol
              }}
            >
              Ciptakan gambar imajinatif dan menakjubkan secara visual melalui
              YOCC AI dan bagikan dengan komunitas.
            </Typography>

            {/* Tombol Call-to-Action yang Menonjol */}
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate("/CreateYocc")}
              sx={{
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: "bold",
                padding: "12px 32px", // Padding lebih besar
                borderRadius: "50px", // Tombol lebih bulat
                boxShadow: "0 4px 14px 0 rgba(0, 118, 255, 0.39)", // Efek bayangan
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              Create Yocc
            </Button>
          </Stack>

          {/* <FlexBox m="20px 0 15px" columnGap={2}>
            <Typography color={shades.primary[300]}>
              Start with a detailed description
            </Typography>
            {!isMobile && (
              <Box
                sx={{
                  cursor: "pointer",
                }}
                padding="7px 10px"
                backgroundColor="secondary.main"
                fontWeight="bold"
                fontSize="12px"
                borderRadius="5px"
                onClick={handleSurpriseMe}
              >
                {user ? "Surprise me" : "Signin"}
              </Box>
            )}
          </FlexBox> */}
        </Box>
      )}
      {/* Input field */}
      {/* {!!user && (
        <Box
          sx={{ zIndex: 100 }}
          margin={{ xs: 0, md: "0 10px 0" }}
          position={`${!isMobile && "sticky"}`}
          top="70px"
        >
          <Input />
        </Box>
      )} */}

      {/* ---------posts---------- */}
      {/* Heading */}
      <Box textAlign={user ? "left" : "center"} mt={{ xs: "60px", md: "90px" }}>
        <Typography mb="5px" variant="h3">
          The Community Showcase
        </Typography>
        <Typography variant="small" color={shades.primary[300]}>
          Browse through a collection of imaginative and visually stunning
          images generated by YOCC AI
        </Typography>
      </Box>
      <Posts {...{ posts, status, community: true }} />
      <PaginationBtns />
    </Box>
  );
};

export default Home;
