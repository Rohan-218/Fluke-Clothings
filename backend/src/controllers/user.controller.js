import userModel from "../models/user.model.js";
import orderModel from "../models/order.model.js";

/**
 * - @route GET /api/user/list
 * - @desc Get all customers with their order counts (Admin only)
 */
const getUsersController = async (req, res) => {
    try {
        const users = await userModel
            .find({ systemUser: { $ne: true } })
            .select("_id name email createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const orderCounts = await orderModel.aggregate([
            {
                $group: {
                    _id: "$userId",
                    totalOrders: {
                        $sum: {
                            $cond: [{ $ne: ["$status", "Cancelled"] }, 1, 0],
                        },
                    },
                    cancelledOrders: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        const orderCountMap = new Map(
            orderCounts.map((item) => [
                item._id.toString(),
                {
                    totalOrders: item.totalOrders,
                    cancelledOrders: item.cancelledOrders,
                },
            ])
        );

        const formattedUsers = users.map((user) => {
            const counts = orderCountMap.get(user._id.toString());

            return {
                ...user,
                totalOrders: counts?.totalOrders || 0,
                cancelledOrders: counts?.cancelledOrders || 0,
            };
        });

        return res.status(200).json({
            status: "success",
            message: "Users fetched successfully",
            users: formattedUsers,
        });
    } catch (error) {
        console.error("Error fetching users:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to fetch users",
        });
    }
};

/**
 * - @route GET /api/user/profile
 * - @desc Get the authenticated customer's profile and order summary
 */
const getUserProfileController = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user._id)
            .select("_id name email createdAt updatedAt")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const [totalOrders, cancelledOrders, recentOrders] = await Promise.all([
            orderModel.countDocuments({
                userId: user._id,
                status: { $ne: "Cancelled" }
            }),
            orderModel.countDocuments({
                userId: user._id,
                status: "Cancelled"
            }),
            orderModel.find({ userId: user._id })
                .select("_id total status paymentStatus paymentMethod createdAt items")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            user: {
                ...user,
                totalOrders,
                cancelledOrders,
                recentOrders
            }
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
};

export {
  getUsersController,
  getUserProfileController
};