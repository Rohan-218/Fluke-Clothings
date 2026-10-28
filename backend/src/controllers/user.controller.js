import userModel from "../models/user.model.js";
import Order from "../models/order.model.js";

const getUsersController = async (req, res) => {
  try {
    const users = await userModel
      .find({ systemUser: { $ne: true } })
      .select("_id name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const orderCounts = await Order.aggregate([
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

export { getUsersController };