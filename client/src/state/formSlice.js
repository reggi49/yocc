import { createSlice } from "@reduxjs/toolkit";
import { STATUS } from "../utils/enums";
import { v4 as uuidv4 } from "uuid";
import { privateInstance } from "../utils/apiInstances";

export const formSlice = createSlice({
  name: "form",
  initialState: {
    prompt: "",
    posts: [
      // {
      //   prompt: "A BBQ that is alive, in the style of a Pixar animated movie",
      //   image:
      //     "https://res.cloudinary.com/dykpwekmx/image/upload/v1676893665/raw4xi7edgxpikfptd9v.png",
      //   id: "raw4xi7edgxpikfptd9v",
      //   index: 0,
      // },
    ],
    status: STATUS.IDLE,
  },
  reducers: {
    updateForm: (state, action) => {
      return { ...state, ...action.payload };
    },
    setStatus: (state, action) => {
      return { ...state, status: action.payload };
    },
    setGeneratedPost: (state, action) => {
      // Menetapkan state 'posts' hanya dengan satu item dari payload
      // dan memberikan 'index: 0' karena ini adalah satu-satunya gambar.
      state.posts = [{ ...action.payload, index: 0 }];
      state.status = STATUS.IDLE;
    },
  },
});

export const { updateForm, setStatus, setGeneratedPost } = formSlice.actions;
export default formSlice.reducer;

export const generatePosts =
  ({ prompt }) =>
  (dispatch) => {
    dispatch(setStatus(STATUS.LOADING));
    privateInstance
      .post("/api/v1/dalle", { prompt })
      .then((data) => {
        dispatch(setStatus(STATUS.IDLE));
        dispatch(
          updateForm({
            posts: data.data.images.map((photo, index) => ({
              id: uuidv4(),
              index,
              image: `data:image/jpeg;base64,${photo.b64_json}`, // for base64 images
              // image: photo.url, // for url version
              prompt: data?.data?.prompt,
            })),
          })
        );
      })
      .catch((err) => {
        dispatch(setStatus(STATUS.ERROR));
      });
  };

export const generatePrompt =
  ({ prompt }) =>
    (dispatch) => {
      dispatch(setStatus(STATUS.LOADING));
      privateInstance
        .post("/api/v1/dalle", { prompt })
        .then((data) => {
          dispatch(setStatus(STATUS.IDLE));
          dispatch(
            updateForm({
              posts: data.data.images.map((photo, index) => ({
                id: uuidv4(),
                index,
                image: `data:image/jpeg;base64,${photo.b64_json}`, // for base64 images
                // image: photo.url, // for url version
                prompt: data?.data?.prompt,
              })),
            })
          );
        })
        .catch((err) => {
          dispatch(setStatus(STATUS.ERROR));
        });
    };