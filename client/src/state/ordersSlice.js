import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateInstance } from "../utils/apiInstances";
import { STATUS } from "../utils/enums";

// Async thunk untuk mengambil data pesanan dari API
export const fetchUserOrders = createAsyncThunk(
    "orders/fetchUserOrders",
    async (_, { rejectWithValue }) => {
        try {
            const response = await privateInstance.get("/api/v1/orders");
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

const ordersSlice = createSlice({
    name: "orders",
    initialState: {
        orders: [],
        status: STATUS.IDLE, // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserOrders.pending, (state) => {
                state.status = STATUS.LOADING;
            })
            .addCase(fetchUserOrders.fulfilled, (state, action) => {
                state.status = STATUS.IDLE;
                state.orders = action.payload;
            })
            .addCase(fetchUserOrders.rejected, (state, action) => {
                state.status = STATUS.ERROR;
                state.error = action.payload;
            });
    },
});

export default ordersSlice.reducer;