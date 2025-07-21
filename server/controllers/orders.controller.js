import Joi from "joi";
import cloudinary from "../config/cloudinary.js";
import Order from "../models/order.model.js"; // <-- Gunakan model Order yang baru

const ordersController = {
    async createCustomOrder(req, res, next) {
        // 1. Skema validasi disesuaikan dengan form pemesanan
        const validationSchema = Joi.object({
            nama: Joi.string().required(),
            email: Joi.string().email().required(),
            alamat: Joi.string().required(),
            warna: Joi.string().required(),
            jumlah: Joi.number().min(1).required(),
            prompt: Joi.string().required(),
            mainReferenceImage: Joi.string().required(), // Diharapkan Base64
            additionalReferenceImage: Joi.string().allow(null, ''), // Opsional
        });

        const { error } = validationSchema.validate(req.body);
        if (error) {
            return next(error);
        }

        const {
            nama,
            email,
            alamat,
            warna,
            jumlah,
            prompt,
            mainReferenceImage,
            additionalReferenceImage,
        } = req.body;

        const { _id: userId } = req.user;

        try {
            // 2. Upload gambar referensi utama ke Cloudinary
            const mainImageUpload = await cloudinary.uploader.upload(mainReferenceImage, {
                folder: "custom_orders",
            });

            let additionalImageUpload = null;
            // 3. Upload gambar tambahan HANYA JIKA ada
            if (additionalReferenceImage) {
                additionalImageUpload = await cloudinary.uploader.upload(additionalReferenceImage, {
                    folder: "custom_orders",
                });
            }

            // 4. Buat dokumen pesanan baru di database
            const newOrder = await Order.create({
                user: userId,
                nama,
                email,
                alamat,
                warna,
                jumlah,
                prompt,
                mainReferenceImage: {
                    url: mainImageUpload.secure_url,
                    public_id: mainImageUpload.public_id,
                },
                // Hanya tambahkan jika ada gambar tambahan
                ...(additionalImageUpload && {
                    additionalReferenceImage: {
                        url: additionalImageUpload.secure_url,
                        public_id: additionalImageUpload.public_id,
                    },
                }),
            });

            res.status(201).json({ success: true, message: "Order created successfully!", order: newOrder });

        } catch (err) {
            // Jika terjadi error, kirim ke error handler
            return next(err);
        }
    },
};

export default ordersController;
