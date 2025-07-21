import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema(
    {
        // Informasi Pengguna yang memesan
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        nama: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        alamat: {
            type: String,
            required: true,
        },

        // Detail Pesanan
        warna: {
            type: String, // Hex code warna yang dipilih
            required: true,
        },
        jumlah: {
            type: Number,
            required: true,
            min: 1,
        },
        prompt: {
            type: String, // Prompt yang digunakan untuk generate gambar
            required: true,
        },

        // Gambar Referensi
        mainReferenceImage: {
            url: { type: String, required: true },
            public_id: { type: String, required: true },
        },
        additionalReferenceImage: {
            url: { type: String },
            public_id: { type: String },
        },

        // Status Pesanan (opsional, bagus untuk masa depan)
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'],
            default: 'Pending',
        }
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
