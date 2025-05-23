"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import randomName from "@scaleway/random-name";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  Share2,
} from "lucide-react";
import Peer from "peerjs";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { ModeToggle } from "../layout/mode-toggle";
import { Icons } from "../shared/icons";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Message = {
  id: string;
  text?: string;
  image?: string;
  isSelf: boolean;
  timestamp: string;
  username: string;
  isSystem?: boolean;
};

type User = {
  peerId: string;
  username: string;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const generateGradientClasses = (seed: string) => {
  const gradients = [
    "bg-gradient-to-br from-red-400 to-pink-500",
    "bg-gradient-to-br from-blue-400 to-indigo-500",
    "bg-gradient-to-br from-green-400 to-teal-500",
    "bg-gradient-to-br from-yellow-400 to-orange-500",
    "bg-gradient-to-br from-purple-400 to-pink-500",
    "bg-gradient-to-br from-cyan-400 to-blue-500",
    "bg-gradient-to-br from-pink-400 to-red-500",
    "bg-gradient-to-br from-teal-400 to-green-500",
    "bg-gradient-to-br from-orange-400 to-yellow-500",
    "bg-gradient-to-br from-indigo-400 to-blue-500",
  ];
  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

export default function ChatRoom() {
  const { isMobile, isSm } = useMediaQuery();
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [avatarClasses, setAvatarClasses] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(!isSm);
  const peerInstance = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);
  const connections = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [isInvited, setIsInvited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSm || isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isSm, isMobile]);

  useEffect(() => {
    if ((remotePeerId || !!searchParams.get("room")) && !isConnected) {
      setIsInvited(true);
    }
  }, [remotePeerId, searchParams, isConnected]);

  useEffect(() => {
    const newUsername = randomName("", ".");
    setUsername(newUsername);
    setAvatarClasses(generateGradientClasses(newUsername));

    const roomId = searchParams.get("room");
    if (roomId) {
      setRemotePeerId(roomId);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      connections.current.forEach((conn) => {
        if (conn.open) conn.close();
      });
      connections.current = [];
      if (connRef.current && connRef.current.open) {
        connRef.current.close();
        connRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const broadcastCount = useCallback((count: number) => {
    connections.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send({ type: "COUNT", data: count });
        } catch (err) {
          console.error("Error broadcasting count:", err);
        }
      }
    });
    setConnectedCount(count);
  }, []);

  const broadcastUserList = useCallback((usersList = users) => {
    const userList = JSON.stringify(usersList);
    connections.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send({ type: "USERLIST", data: userList });
        } catch (err) {
          console.error("Error broadcasting user list:", err);
        }
      }
    });
  }, [users]);

  const broadcastMessage = useCallback((message: Message, senderConn: any) => {
    connections.current.forEach((conn) => {
      if (conn !== senderConn && conn.open) {
        try {
          if (message.image) {
            conn.send({
              type: "IMAGE",
              data: { username: message.username, image: message.image },
            });
          } else if (message.text) {
            conn.send({
              type: "TEXT",
              data: { username: message.username, text: message.text },
            });
          }
        } catch (err) {
          console.error("Error broadcasting message:", err);
        }
      }
    });
  }, []);

  const handleConnection = useCallback((conn: any) => {
    conn.on("open", () => {
      setIsConnected(true);
      setConnectedCount((prev) => {
        const newCount = prev + 1;
        broadcastCount(newCount);
        return newCount;
      });

      setTimeout(() => {
        const userList = JSON.stringify(users);
        conn.send({ type: "USERLIST", data: userList });
      }, 100);
    });

    conn.on("data", (data: any) => {
      if (typeof data === "object" && data.type) {
        if (data.type === "JOIN") {
          const { username: joiningUsername, peerId: joiningPeerId } =
            data.data;
          const joinMessage = {
            id: crypto.randomUUID(),
            text: `[${joiningUsername}] 进入了房间`,
            isSelf: false,
            timestamp: formatTime(new Date()),
            username: "系统",
            isSystem: true,
          };
          setMessages((prev) => [...prev, joinMessage]);
          setUsers((prev) => {
            if (!prev.some((u) => u.peerId === joiningPeerId)) {
              const updatedUsers = [
                ...prev,
                { peerId: joiningPeerId, username: joiningUsername },
              ];
              setTimeout(() => {
                broadcastUserList(updatedUsers);
                broadcastCount(updatedUsers.length);
              }, 100);
              return updatedUsers;
            }
            return prev;
          });
          broadcastMessage(joinMessage, conn);
        } else if (data.type === "COUNT") {
          setConnectedCount(data.data);
        } else if (data.type === "USERLIST") {
          try {
            const userList = JSON.parse(data.data);
            setUsers((prev) => {
              const mergedUsers = [...userList];
              if (!mergedUsers.some((u) => u.peerId === peerId)) {
                mergedUsers.push({ peerId, username });
              }
              return mergedUsers;
            });
          } catch (e) {
            console.error("Failed to parse user list:", e);
          }
        } else if (data.type === "LEAVE") {
          const { username: leavingUsername, peerId: leavingPeerId } =
            data.data;
          const leaveMessage = {
            id: crypto.randomUUID(),
            text: `[${leavingUsername}] 离开了房间`,
            isSelf: false,
            timestamp: formatTime(new Date()),
            username: "系统",
            isSystem: true,
          };
          setMessages((prev) => [...prev, leaveMessage]);
          broadcastMessage(leaveMessage, conn);
        } else if (data.type === "IMAGE") {
          const { username: senderUsername, image } = data.data;
          const newMessage = {
            id: crypto.randomUUID(),
            image,
            isSelf: false,
            timestamp: formatTime(new Date()),
            username: senderUsername,
          };
          setMessages((prev) => [...prev, newMessage]);
          broadcastMessage(newMessage, conn);
        } else if (data.type === "TEXT") {
          const { username: senderUsername, text } = data.data;
          const newMessage = {
            id: crypto.randomUUID(),
            text,
            isSelf: false,
            timestamp: formatTime(new Date()),
            username: senderUsername,
          };
          setMessages((prev) => [...prev, newMessage]);
          broadcastMessage(newMessage, conn);
        }
      }
    });

    conn.on("close", () => {
      connections.current = connections.current.filter((c) => c !== conn);
      const disconnectedUser = users.find((user) => user.peerId === conn.peer);
      if (disconnectedUser) {
        const leaveMessage = {
          id: crypto.randomUUID(),
          text: `[${disconnectedUser.username}] 离开了房间`,
          isSelf: false,
          timestamp: formatTime(new Date()),
          username: "系统",
          isSystem: true,
        };
        setMessages((prev) => [...prev, leaveMessage]);
        setUsers((prev) => {
          const updatedUsers = prev.filter((user) => user.peerId !== conn.peer);
          setTimeout(() => {
            broadcastUserList(updatedUsers);
            broadcastCount(updatedUsers.length);
          }, 100);
          return updatedUsers;
        });
      }
      if (!connRef.current && connections.current.length === 0) {
        setIsConnected(false);
      }
    });
  }, [users, peerId, username, broadcastUserList, broadcastCount, broadcastMessage]);

  const initializePeer = useCallback(() => {
    if (peerInstance.current) return;

    try {
      const peer = new Peer({
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      peerInstance.current = peer;

      peer.on("open", (id) => {
        setPeerId(id);
        setUsers((prev) => {
          const newUser = { peerId: id, username };
          if (!prev.some((u) => u.peerId === id)) {
            return [...prev, newUser];
          }
          return prev;
        });
        setConnectedCount(1);
      });

      if (!isInvited) {
        peer.on("connection", (conn) => {
          connections.current.push(conn);
          handleConnection(conn);
        });
      }

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        toast.error("连接错误，请重试");
        setIsConnected(false);
      });

      peer.on("disconnected", () => {
        setIsConnected(false);
        toast.warning("已断开与对等网络的连接");
      });
    } catch (err) {
      console.error("Failed to initialize peer:", err);
      toast.error("初始化对等连接失败");
    }
  }, [username, isInvited, handleConnection]);

  useEffect(() => {
    if (username) {
      initializePeer();
    }
  }, [initializePeer, username]);

  const connectToPeer = useCallback(() => {
    if (!peerInstance.current || !remotePeerId) return;

    try {
      if (connRef.current) {
        connRef.current.close();
      }

      const conn = peerInstance.current.connect(remotePeerId);
      connRef.current = conn;

      conn.on("open", () => {
        conn.send({ type: "JOIN", data: { username, peerId } });
        setIsConnected(true);
      });

      conn.on("data", (data: any) => {
        if (typeof data === "object" && data.type) {
          if (data.type === "JOIN") {
            const { username: joiningUsername, peerId: joiningPeerId } =
              data.data;
            const joinMessage = {
              id: crypto.randomUUID(),
              text: `[${joiningUsername}] 进入了房间`,
              isSelf: false,
              timestamp: formatTime(new Date()),
              username: "系统",
              isSystem: true,
            };
            setMessages((prev) => [...prev, joinMessage]);
            setUsers((prev) => {
              if (!prev.some((u) => u.peerId === joiningPeerId)) {
                return [
                  ...prev,
                  { peerId: joiningPeerId, username: joiningUsername },
                ];
              }
              return prev;
            });
          } else if (data.type === "COUNT") {
            setConnectedCount(data.data);
          } else if (data.type === "USERLIST") {
            try {
              const userList = JSON.parse(data.data);
              setUsers((prev) => {
                const mergedUsers = [...userList];
                if (!mergedUsers.some((u) => u.peerId === peerId)) {
                  mergedUsers.push({ peerId, username });
                }
                return mergedUsers.filter(
                  (user, index, self) =>
                    index === self.findIndex((u) => u.peerId === user.peerId),
                );
              });
            } catch (err) {
              console.error("Error parsing user list:", err);
            }
          } else if (data.type === "LEAVE") {
            const { username: leavingUsername, peerId: leavingPeerId } =
              data.data;
            const leaveMessage = {
              id: crypto.randomUUID(),
              text: `[${leavingUsername}] 离开了房间`,
              isSelf: false,
              timestamp: formatTime(new Date()),
              username: "系统",
              isSystem: true,
            };
            setMessages((prev) => [...prev, leaveMessage]);
          } else if (data.type === "IMAGE") {
            const { username: senderUsername, image } = data.data;
            const newMessage = {
              id: crypto.randomUUID(),
              image,
              isSelf: false,
              timestamp: formatTime(new Date()),
              username: senderUsername,
            };
            setMessages((prev) => [...prev, newMessage]);
          } else if (data.type === "TEXT") {
            const { username: senderUsername, text } = data.data;
            const newMessage = {
              id: crypto.randomUUID(),
              text,
              isSelf: false,
              timestamp: formatTime(new Date()),
              username: senderUsername,
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      });

      conn.on("close", () => {
        setIsConnected(false);
        connRef.current = null;
        const disconnectedUser = users.find(
          (user) => user.peerId === remotePeerId,
        );
        if (disconnectedUser) {
          const leaveMessage = {
            id: crypto.randomUUID(),
            text: `[${disconnectedUser.username}] 离开了房间`,
            isSelf: false,
            timestamp: formatTime(new Date()),
            username: "系统",
            isSystem: true,
          };
          setMessages((prev) => [...prev, leaveMessage]);
        }
        setUsers((prev) => {
          const updatedUsers = prev.filter(
            (user) => user.peerId !== remotePeerId,
          );
          setConnectedCount(updatedUsers.length);
          return updatedUsers;
        });
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
        toast.error("连接错误。请重试。");
        if (connRef.current === conn) {
          connRef.current = null;
          setIsConnected(false);
        }
      });
    } catch (err) {
      console.error("Failed to connect to peer:", err);
      toast.error("连接对等方失败");
    }
  }, [remotePeerId, username, peerId, users]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("图片大小不应超过5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(file);
        sendImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendImage = (base64Image: string) => {
    if (!base64Image || isSending) return;

    setIsSending(true);
    const newMessage = {
      id: crypto.randomUUID(),
      image: base64Image,
      isSelf: true,
      timestamp: formatTime(new Date()),
      username,
    };
    setMessages((prev) => [...prev, newMessage]);

    try {
      if (connRef.current && connRef.current.open) {
        connRef.current.send({
          type: "IMAGE",
          data: { username, image: base64Image },
        });
      } else if (!isInvited && connections.current.length > 0) {
        connections.current.forEach((conn) => {
          if (conn.open) {
            conn.send({
              type: "IMAGE",
              data: { username, image: base64Image },
            });
          }
        });
      }
    } catch (err) {
      console.error("Failed to send image:", err);
      toast.error("发送图片失败");
      setIsSending(false);
    }

    setSelectedImage(null);
    setIsSending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = useCallback(() => {
    if (!message || isSending) return;

    setIsSending(true);
    const newMessage = {
      id: crypto.randomUUID(),
      text: message,
      isSelf: true,
      timestamp: formatTime(new Date()),
      username,
    };
    setMessages((prev) => [...prev, newMessage]);

    try {
      if (connRef.current && connRef.current.open) {
        connRef.current.send({
          type: "TEXT",
          data: { username, text: message },
        });
      } else if (!isInvited && connections.current.length > 0) {
        connections.current.forEach((conn) => {
          if (conn.open) {
            conn.send({ type: "TEXT", data: { username, text: message } });
          }
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("发送消息失败");
      setIsSending(false);
    }

    setMessage("");
    setIsSending(false);
  }, [message, username, isSending, isInvited]);

  const copyPeerId = () => {
    try {
      navigator.clipboard.writeText(peerId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      toast.error("复制ID失败");
    }
  };

  const shareRoom = () => {
    try {
      if (!peerId) {
        toast.error("没有可分享的房间");
        return;
      }
      const url = `${window.location.origin}/chat?room=${peerId}`;
      navigator.clipboard.writeText(url);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 3000);
      toast.success("房间链接已复制到剪贴板");
    } catch (err) {
      toast.error("复制房间链接失败");
    }
  };

  const createNewRoom = () => {
    if (peerInstance.current) {
      if (username && peerId) {
        connections.current.forEach((conn) => {
          if (conn.open) {
            try {
              conn.send({ type: "LEAVE", data: { username, peerId } });
            } catch (err) {
              console.error("Error sending leave notification:", err);
            }
          }
        });
      }

      peerInstance.current.destroy();
      peerInstance.current = null;
      connections.current.forEach((conn) => {
        if (conn.open) conn.close();
      });
      connections.current = [];
      if (connRef.current && connRef.current.open) {
        connRef.current.close();
      }
      connRef.current = null;

      setPeerId("");
      setRemotePeerId("");
      setMessages([]);
      setUsers([]);
      setIsConnected(false);
      setConnectedCount(0);

      setTimeout(() => {
        initializePeer();
      }, 500);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      {(isMobile && isSidebarOpen) || (!isMobile && isSidebarOpen) ? (
        <div
          className={`${
            isMobile
              ? "fixed inset-0 z-50 w-full"
              : "w-[300px] shrink-0 border-r dark:border-neutral-600"
          } flex animate-fade-in-left flex-col bg-white p-4 transition-all duration-300 dark:bg-neutral-800`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
              用户 ({users.length})
            </h2>
            <Button
              variant={"ghost"}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-5 p-0 text-neutral-600 hover:text-blue-500 dark:text-neutral-400 dark:hover:text-blue-400"
            >
              {!isSidebarOpen ? (
                <PanelRightClose size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </Button>
          </div>

          <div className="max-h-[calc(100vh-12rem)] flex-1 space-y-2 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                暂无用户
              </p>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.peerId}
                  className="flex items-center gap-2 rounded-lg p-2 text-sm text-neutral-700 dark:text-neutral-300"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${generateGradientClasses(user.username)}`}
                  >
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="truncate">{user.username}</span>
                  {index === 0 && <Badge>房主</Badge>}
                </div>
              ))
            )}
          </div>
          <Button
            onClick={createNewRoom}
            variant={"outline"}
            className="mt-auto flex items-center justify-center gap-1"
          >
            <Plus size={20} />
            新建房间
          </Button>
        </div>
      ) : null}

      <div
        className={`grids grids-dark flex flex-1 flex-col bg-white px-4 pb-1 pt-3 transition-all duration-300 dark:bg-neutral-800 ${
          isMobile || !isSidebarOpen ? "w-full" : ""
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="mr-auto flex items-center gap-2">
            <Button
              variant={"ghost"}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-5 p-0 text-neutral-600 hover:text-blue-500 dark:text-neutral-400 dark:hover:text-blue-400"
            >
              {!isSidebarOpen && <PanelRightClose size={20} />}
            </Button>
            <Link
              href={"/chat"}
              className="text-2xl font-bold text-neutral-800 dark:text-neutral-100"
              style={{ fontFamily: "Bahamas Bold" }}
            >
              WRoom
            </Link>
            <Badge>Beta</Badge>
          </div>

          {!isMobile && (
            <>
              <Link
                className="text-sm hover:underline"
                href={"/docs/wroom"}
                target="_blank"
              >
                关于
              </Link>
              <Link
                className="text-sm hover:underline"
                href={"/dashboard"}
                target="_blank"
              >
                控制台
              </Link>
            </>
          )}
          <div className="flex items-center gap-2">
            <Badge className="flex items-center gap-1 text-xs text-green-300 dark:text-green-700">
              <Icons.users className="size-3" /> 在线: {connectedCount}
            </Badge>
          </div>
          <ModeToggle />
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              您的ID:
            </span>
            <Input
              type="text"
              value={peerId}
              readOnly
              className="flex-1 rounded border border-neutral-200 bg-neutral-100 p-2 text-sm text-neutral-800 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
            />
            <Button
              variant={"default"}
              onClick={shareRoom}
              className="flex items-center gap-2"
              title="分享房间"
              size={"sm"}
              disabled={!peerId}
            >
              {!peerId ? (
                "创建房间中"
              ) : (
                <>
                  {isShareCopied ? <Check size={16} /> : <Share2 size={16} />}
                  {!isMobile && "分享房间"}
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              房间ID:
            </span>
            {!isInvited && isConnected ? (
              <Input
                type="text"
                placeholder="您是房间主人"
                readOnly
                disabled
                className="flex-1 rounded border bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-400"
              />
            ) : (
              <Input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="输入房间ID"
                readOnly={isConnected}
                disabled={isConnected}
                className="flex-1 rounded border bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-400"
              />
            )}
            <Button
              variant={"secondary"}
              onClick={connectToPeer}
              disabled={!peerId || !remotePeerId || isConnected}
              size={"sm"}
              className={cn(
                "flex items-center gap-2 rounded bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-blue-600 dark:hover:bg-blue-700",
                isConnected &&
                  "bg-green-500 disabled:bg-green-600 dark:bg-green-600",
              )}
            >
              <Icons.unplug size={16} />
              {isConnected ? "已连接" : "连接"}
            </Button>
          </div>
        </div>

        <div className="h-full min-h-[100px] overflow-y-auto rounded-md rounded-b-none border border-neutral-200 bg-white p-4 dark:border-neutral-600 dark:bg-neutral-700">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 ${
                msg.isSystem
                  ? "flex justify-center"
                  : `flex items-start gap-2 ${msg.isSelf ? "justify-end" : "justify-start"}`
              }`}
            >
              {!msg.isSystem ? (
                <>
                  {!msg.isSelf && (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${generateGradientClasses(
                        msg.username,
                      )}`}
                    >
                      {msg.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex max-w-[70%] flex-col">
                    <div
                      className={`mb-1 text-sm font-medium ${
                        msg.isSelf
                          ? "text-right text-blue-600 dark:text-blue-400"
                          : "text-left text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {msg.username}
                    </div>
                    <div
                      className={`rounded-lg px-2 pb-1 pt-2 ${
                        msg.isSelf
                          ? "bg-blue-500 text-white dark:bg-blue-600"
                          : "bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-200"
                      }`}
                    >
                      {msg.text && <p className="text-sm">{msg.text}</p>}
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="发送的图片"
                          className="max-w-full rounded-md"
                          style={{ maxHeight: "200px" }}
                        />
                      )}
                      <span
                        className={cn(
                          "mt-1 block text-xs opacity-70",
                          !msg.isSelf && "text-right",
                        )}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                  {msg.isSelf && (
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${avatarClasses}`}
                    >
                      {username?.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm italic text-neutral-500 dark:text-neutral-400">
                  {msg.text}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="relative rounded-b-md">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`你好 ${username || "加载中..."}，发送消息开始聊天...`}
            className="min-h-20 flex-1 rounded-md rounded-t-none border border-t-0 bg-neutral-50 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-600 dark:text-neutral-200 dark:placeholder:text-neutral-400"
            onKeyPress={(e) =>
              e.key === "Enter" && !e.shiftKey && sendMessage()
            }
            disabled={!isConnected}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isSending}
              title="发送图片"
            >
              <ImageIcon size={16} />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              onClick={sendMessage}
              disabled={
                !isConnected || (!message && !selectedImage) || isSending
              }
              size={"sm"}
            >
              {isSending ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Icons.send className="size-4" />
              )}
            </Button>
          </div>
        </div>

        <footer className="mt-2 py-2 text-center text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          由{" "}
          <Link
            className="hover:underline"
            href={"https://qali.cn"}
            target="_blank"
            style={{ fontFamily: "Bahamas Bold" }}
          >
            {siteConfig.name}
          </Link>
          {" "}提供支持
        </footer>
      </div>
    </div>
  );
}
