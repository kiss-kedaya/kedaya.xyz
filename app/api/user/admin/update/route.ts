import { checkUserStatus, updateUser } from "@/lib/dto/user";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = checkUserStatus(await getCurrentUser());
    if (user instanceof Response) return user;
    if (user.role !== "ADMIN") {
      return Response.json({ message: "未授权" }, {
        status: 401,
      });
    }

    const { id, data } = await req.json();

    const updatedUser = await updateUser(id, {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
      team: data.team,
      image: data.image,
      apiKey: data.apiKey,
    });
    if (!updatedUser?.id) {
      return Response.json({ message: "发生错误" }, {
        status: 400,
      });
    }
    return Response.json({ 
      message: "成功",
      user: updatedUser
    });
  } catch (error) {
    return Response.json({ statusText: "服务器错误" }, { status: 500 });
  }
}
