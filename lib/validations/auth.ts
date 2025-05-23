import { UserRole } from "@prisma/client";
import * as z from "zod";

export const userAuthSchema = z.object({
  email: z.string().email({
    message: "请输入有效的电子邮箱地址"
  }).refine(email => {
    // 检查是否为qq.com域名
    return !email.toLowerCase().endsWith('@qq.com');
  }, {
    message: "目前不支持QQ邮箱注册，请使用其他邮箱"
  }),
  password: z.string().min(8, {
    message: "密码长度必须至少为8个字符"
  }).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email(),
  image: z.string(),
  name: z.string(),
  active: z.number().default(1),
  team: z.string(),
  role: z.nativeEnum(UserRole),
});
