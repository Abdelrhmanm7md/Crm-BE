import { notificationModel } from "../../database/models/notification.model.js";
import { sio } from "../../server.js";

export const sendNotification = async (
  message_en,
  message_ar,
  type,
  receivers,
  invitation
) => {
  try {
    if (!Array.isArray(receivers)) {
      receivers = [receivers];
    }
    receivers = [...new Set(receivers.filter(Boolean).map(String))];
    function cleanList(arr) {
      // to remove duplicates and undefined values
      return Array.from(new Set(arr)).filter((item) => item !== undefined);
    }
    receivers = cleanList(receivers);
    let message = {};
    message.message_en = message_en;
    message.message_ar = message_ar;
    let icon = type;
    if (type == "warning") {
      icon = "image/warning.png";
    }
    if (type == "success") {
      icon = "image/success.png";
    }
    if (type == "support") {
      icon = "image/support.png";
    }
    for (let index = 0; index < receivers.length; index++) {
      let receiver = receivers[index];
      const newNotif = new notificationModel({ message, icon, receiver });
      const savedNotif = await newNotif.save();
      let createdAt = savedNotif.createdAt;

      if (invitation) {
        sio.emit(`notification_`, {
          message,
          icon,
          receiver,
          createdAt,
          invitation,
        });
      } else {
        sio.emit(`notification_`, { message, icon, receiver, createdAt });
      }
    }
  } catch (error) {
    console.log(error, "error in sending notification");
  }
};
