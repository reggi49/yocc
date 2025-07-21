import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { shallowEqual, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { FlexBox } from "../../components/FlexBox";
import { Box, IconButton, styled, useMediaQuery } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { shades } from "../../theme";

const SingleImage = () => {
  const isMobile = useMediaQuery("(max-width:767px)");
  const navigate = useNavigate();
  const { posts } = useSelector((state) => state.formReducer, shallowEqual);
  const { id } = useParams();

  const currentPost = posts.find((node) => node.id == id);
  if (!currentPost) {
    return null; // atau tampilkan loading/error message
  }

  let { image, index, prompt } = posts.find((node) => node.id == id);

  return (
    <FlexBox position="relative" justifyContent="center">
      {/* left swipe */}
      {/* HANYA TAMPILKAN TOMBOL JIKA ADA LEBIH DARI 1 GAMBAR */}
      {posts.length > 1 && (
        <>
          {/* left swipe */}
          <SwipeBtn
            idx={0}
            index={index}
            mobile={isMobile.toString()}
            disabled={index === 0}
            variant="prev"
            onClick={() => navigate(`/search/single/${posts[index - 1].id}`)}
          >
            <ChevronLeftIcon />
          </SwipeBtn>

          {/* right swipe */}
          <SwipeBtn
            idx={posts.length - 1} // Sesuaikan dengan panjang array
            index={index}
            mobile={isMobile.toString()}
            variant="next"
            disabled={index === posts.length - 1}
            onClick={() => navigate(`/search/single/${posts[index + 1].id}`)}
          >
            <ChevronRightIcon />
          </SwipeBtn>
        </>
      )}
      {/* Image */}
      <Box width={{ xs: "100%", md: "416px" }}>
        <img src={image} alt={prompt} width="100%" />
      </Box>
    </FlexBox>
  );
};

export default SingleImage;

const SwipeBtn = styled(IconButton)(
  ({ mobile, index, idx, variant, disabled }) => ({
    position: `${mobile === "true" ? "absolute" : undefined}`,
    top: `${mobile === "true" && "50%"}`,
    right: `${mobile === "true" && variant === "next" && "5px"}`,
    left: `${mobile === "true" && variant === "prev" && "5px"}`,
    color: `${mobile === "true" && "#fff"}`,
    padding: `${mobile === "true" ? "2px" : "10px"}`,
    transform: `${mobile === "true" && "translateY(-50%)"}`,
    transition: "0.2s",
    opacity: `${index == idx ? 0 : 1}`,
    pointerEvents: `${disabled ? "none" : "auto"}`,
    borderRadius: "5px",
    backgroundColor: `${
      mobile === "true"
        ? `rgba(0,0,0,0.3) !important`
        : `${shades.secondary[300]} !important`
    }`,
    ":hover": {
      backgroundColor: `${
        mobile === "true"
          ? "rgba(0,0,0,0.5) !important"
          : `${shades.secondary[100]} !important`
      }`,
    },
  })
);
