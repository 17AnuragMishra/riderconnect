import { BasicUserInfo } from "@/types/user";
import { title } from "radash";

export function getUsername(user?: BasicUserInfo) {
  if (!user) {
    return "Unknown";
  }
  return title(
    user.username ||
      user.name ||
      user.personalInfo?.firstName + " " + user.personalInfo?.lastName
  );
}
