"use client";

import { useRef, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { isLink } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BlurImage from "@/components/shared/blur-image";

export interface MetaScrapingProps {
  title: string;
  description: string;
  image: string;
  icon: string;
  url: string;
  lang: string;
  author: string;
  timestamp: string;
  payload: string;
}

export interface MarkdownScrapingProps {
  url: string;
  content: string;
  format: string;
  timestamp: string;
  payload: string;
}

export function ScreenshotScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [protocol, setProtocol] = useState("https://");

  const [isShoting, setIsShoting] = useState(false);
  const [currentScreenshotLink, setCurrentScreenshotLink] =
    useState("vmail.dev");
  const [screenshotInfo, setScreenshotInfo] = useState({
    tmp_url: "",
  });

  const handleScrapingScreenshot = async () => {
    if (currentScreenshotLink) {
      setIsShoting(true);
      const payload = `/api/v1/scraping/screenshot?url=${protocol}${currentScreenshotLink}&key=${user.apiKey}`;
      const res = await fetch(payload);
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const blob = await res.blob();
        const imageUrl = URL.createObjectURL(blob);
        setScreenshotInfo({
          tmp_url: imageUrl
        });
        toast.success("成功！");
      }
      setIsShoting(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://qali.cn/api/v1/scraping/screenshot`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>
            自动截取网站截图并将其转换为应用程序的精美视觉效果。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue="https://"
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentScreenshotLink}
              size={100}
              onChange={(e) => setCurrentScreenshotLink(e.target.value)}
            />
            <Button
              className="flex items-center gap-1.5 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleScrapingScreenshot}
              disabled={isShoting}
            >
              {isShoting ? (
                <span className="text-sm">抓取中...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className="text-xs">截图</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              className="max-w-2xl overflow-auto p-2"
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              value={screenshotInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              // shortenTextAfterLength={50}
            />
            {screenshotInfo.tmp_url && (
              <BlurImage
                src={screenshotInfo.tmp_url}
                alt="网站预览图"
                className="my-4 flex rounded-md border object-contain object-center shadow-md"
                width={1500}
                height={750}
                priority
                // placeholder="blur"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function MetaScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [currentLink, setCurrentLink] = useState("qali.cn");
  const [protocol, setProtocol] = useState("https://");
  const [metaInfo, setMetaInfo] = useState<MetaScrapingProps>({
    title: "",
    description: "",
    image: "",
    icon: "",
    url: "",
    lang: "",
    author: "",
    timestamp: "",
    payload: "",
  });
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapingMeta = async () => {
    if (currentLink) {
      setIsScraping(true);
      const res = await fetch(
        `/api/v1/scraping/meta?url=${protocol}${currentLink}&key=${user.apiKey}`,
      );
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const data = await res.json();
        setMetaInfo(data);
        toast.success("成功！");
      }
      setIsScraping(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://qali.cn/api/v1/scraping/meta`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>抓取网站的元数据信息。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue={"https://"}
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentLink}
              size={100}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
            <Button
              className="flex items-center gap-1.5 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleScrapingMeta}
              disabled={isScraping}
            >
              {isScraping ? (
                <span className="text-sm">抓取中...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-xs">分析</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              className="max-w-2xl overflow-auto p-2"
              value={metaInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              // shortenTextAfterLength={50}
            />
            {metaInfo.image && (
              <BlurImage
                src={metaInfo.image}
                alt={metaInfo.title || "网站图片"}
                className="my-4 max-h-64 rounded-lg border shadow-sm"
                width={512}
                height={512}
                priority
                // placeholder="blur"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function MarkdownScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [currentLink, setCurrentLink] = useState("qali.cn");
  const [protocol, setProtocol] = useState("https://");
  const [mdInfo, setMdInfo] = useState<MarkdownScrapingProps>({
    url: "",
    content: "",
    format: "",
    timestamp: "",
    payload: "",
  });
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapingMeta = async () => {
    if (currentLink) {
      setIsScraping(true);
      const res = await fetch(
        `/api/v1/scraping/markdown?url=${protocol}${currentLink}&key=${user.apiKey}`,
      );
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const data = await res.json();
        setMdInfo(data);
        toast.success("成功！");
      }
      setIsScraping(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://qali.cn/api/v1/scraping/markdown`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>将网站内容转换为Markdown格式。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue={"https://"}
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentLink}
              size={100}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
            <Button
              className="flex items-center gap-1.5 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleScrapingMeta}
              disabled={isScraping}
            >
              {isScraping ? (
                <span className="text-sm">抓取中...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15h6" />
                    <path d="M9 11h6" />
                  </svg>
                  <span className="text-xs">转换</span>
                </>
              )}
            </Button>
          </div>
          <div className="mt-4 rounded-md border p-3">
            <JsonView
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              className="max-w-2xl overflow-auto p-2"
              value={mdInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              shortenTextAfterLength={50}
            />

            {mdInfo.content && (
              <pre className="my-4 max-h-64 overflow-y-auto rounded-md border bg-slate-50 p-4 text-xs dark:bg-slate-900">
                {mdInfo.content}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function TextScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [currentLink, setCurrentLink] = useState("qali.cn");
  const [protocol, setProtocol] = useState("https://");
  const [textInfo, setTextInfo] = useState({
    url: "",
    content: "",
    format: "",
    timestamp: "",
    payload: "",
  });
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapingMeta = async () => {
    if (currentLink) {
      setIsScraping(true);
      const res = await fetch(
        `/api/v1/scraping/text?url=${protocol}${currentLink}&key=${user.apiKey}`,
      );
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const data = await res.json();
        setTextInfo(data);
        toast.success("成功！");
      }
      setIsScraping(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://qali.cn/api/v1/scraping/text`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>提取网站纯文本内容。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue={"https://"}
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentLink}
              size={100}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
            <Button
              className="flex items-center gap-1.5 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleScrapingMeta}
              disabled={isScraping}
            >
              {isScraping ? (
                <span className="text-sm">抓取中...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span className="text-xs">提取</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              className="max-w-2xl overflow-auto p-2"
              value={textInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              shortenTextAfterLength={50}
            />

            {textInfo.content && (
              <pre className="my-4 max-h-64 overflow-y-auto rounded-md border bg-slate-50 p-4 text-xs dark:bg-slate-900">
                {textInfo.content}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function QrCodeScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [protocol, setProtocol] = useState("https://");

  const [isShoting, setIsShoting] = useState(false);
  const [currentQrLink, setCurrentQrLink] = useState("qali.cn");
  const [qrInfo, setQrInfo] = useState("");

  const handleScrapingScreenshot = async () => {
    if (currentQrLink) {
      setIsShoting(true);
      const payload = `/api/v1/scraping/qrcode`;
      try {
        const res = await fetch(payload, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: `${protocol}${currentQrLink}`,
            key: user.apiKey,
          }),
        });

        if (!res.ok || res.status !== 200) {
          toast.error(res.statusText || "生成二维码失败");
        } else {
          // 直接获取base64图片数据
          const dataUrl = await res.text();
          // 确保base64图片数据可以正确显示
          const validImageData = dataUrl.startsWith("data:image")
            ? dataUrl
            : `data:image/png;base64,${dataUrl.replace(/^data:image\/png;base64,/, "")}`;
          setQrInfo(validImageData);
          toast.success("成功！");
        }
      } catch (error) {
        toast.error("生成二维码失败，请重试");
      } finally {
        setIsShoting(false);
      }
    }
  };

  const handleDownloadQrCode = async () => {
    const link = document.createElement("a");
    link.download = `QRCODE-${currentQrLink}.png`;
    link.href = qrInfo;
    link.click();
  };

  return (
    <>
      <CodeLight
        content={`POST https://qali.cn/api/v1/scraping/qrcode
Content-Type: application/json

{
  "url": "https://example.com",
  "key": "YOUR_API_KEY"
}`}
      />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>二维码生成</CardTitle>
          <CardDescription>
            生成任何URL的二维码，方便在移动设备上快速访问网站。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue="https://"
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentQrLink}
              size={100}
              onChange={(e) => setCurrentQrLink(e.target.value)}
            />
            <Button
              className="flex items-center gap-1.5 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleScrapingScreenshot}
              disabled={isShoting}
            >
              {isShoting ? (
                <span className="text-sm">生成中...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" />
                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                    <path d="M3 12h.01" />
                    <path d="M12 3h.01" />
                    <path d="M12 16v.01" />
                    <path d="M16 12h1" />
                    <path d="M21 12v.01" />
                    <path d="M12 21v-1" />
                  </svg>
                  <span className="text-xs">生成</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            {qrInfo && (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={qrInfo}
                  alt="QR Code"
                  className="my-4 flex max-h-52 rounded-md border object-contain object-center shadow-md"
                  width={200}
                  height={200}
                />
                <Button
                  className="mt-2 flex items-center gap-1.5"
                  variant="outline"
                  onClick={handleDownloadQrCode}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  <span className="text-xs">下载二维码</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function QrCodeDecoding({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<{
    text: string;
    error?: string;
  }>({
    text: "",
  });
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [inputType, setInputType] = useState<"url" | "file">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从URL解析二维码
  const handleDecodeFromUrl = async () => {
    if (!qrImageUrl) {
      toast.error("请输入图片URL");
      return;
    }

    if (!user.apiKey) {
      toast.error("请先获取API密钥");
      return;
    }

    setIsDecoding(true);
    setDecodedResult({ text: "" });

    try {
      const response = await fetch("/api/v1/scraping/qrcode-decode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: qrImageUrl,
          key: user.apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDecodedResult({
          text: "",
          error: errorData.statusText || "解析失败",
        });
        toast.error(errorData.statusText || "解析失败");
      } else {
        const data = await response.json();
        setDecodedResult({ text: data.text});
        toast.success("解析成功！");
      }
    } catch (error) {
      setDecodedResult({ text: "", error: "解析请求失败" });
      toast.error("解析请求失败");
    } finally {
      setIsDecoding(false);
    }
  };

  // 从文件解析二维码
  const handleDecodeFromFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user.apiKey) {
      toast.error("请先获取API密钥");
      return;
    }

    setIsDecoding(true);
    setDecodedResult({ text: "" });

    try {
      // 读取文件为base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        try {
          const response = await fetch("/api/v1/scraping/qrcode-decode", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base64,
              key: user.apiKey,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            setDecodedResult({
              text: "",
              error: errorData.statusText || "解析失败",
            });
            toast.error(errorData.statusText || "解析失败");
          } else {
            const data = await response.json();
            setDecodedResult({ text: data.text});
            toast.success("解析成功！");
          }
        } catch (error) {
          setDecodedResult({ text: "", error: "解析请求失败" });
          toast.error("解析请求失败");
        } finally {
          setIsDecoding(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setIsDecoding(false);
      toast.error("读取文件失败");
    }
  };

  // 触发文件选择对话框
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 访问解析出的URL
  const handleVisitDecodedUrl = () => {
    if (decodedResult.text && isLink(decodedResult.text)) {
      window.open(decodedResult.text, "_blank");
    } else {
      toast.error("解析结果不是有效的URL");
    }
  };

  return (
    <>
      <CodeLight
        content={`POST https://qali.cn/api/v1/scraping/qrcode-decode
Content-Type: application/json

{
  "url": "https://example.com/qrcode.png",
  "key": "YOUR_API_KEY"
}

// 或者使用base64编码的图片
{
  "base64": "data:image/png;base64,...",
  "key": "YOUR_API_KEY"
}`}
      />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>二维码解析</CardTitle>
          <CardDescription>
            解析图片中的二维码，获取其中包含的URL或文本内容。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="url-input"
                checked={inputType === "url"}
                onChange={() => setInputType("url")}
                className="h-4 w-4 rounded-full border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="url-input" className="text-sm font-medium">
                图片URL
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="file-input"
                checked={inputType === "file"}
                onChange={() => setInputType("file")}
                className="h-4 w-4 rounded-full border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="file-input" className="text-sm font-medium">
                上传图片
              </label>
            </div>
          </div>

          {inputType === "url" ? (
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="输入包含二维码的图片URL"
                className="h-10 rounded-r-none border focus:border-primary active:border-primary"
                value={qrImageUrl}
                onChange={(e) => setQrImageUrl(e.target.value)}
              />
              <Button
                className="flex items-center gap-1.5 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleDecodeFromUrl}
                disabled={isDecoding}
              >
                {isDecoding ? (
                  <span className="text-sm">解析中...</span>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    </svg>
                    <span className="text-xs">解析</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDecodeFromFile}
                className="hidden"
              />
              <Button
                className="flex w-full items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleOpenFileDialog}
                disabled={isDecoding}
              >
                {isDecoding ? (
                  <span className="text-sm">解析中...</span>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4-5 4 5" />
                    </svg>
                    <span className="text-sm">选择包含二维码的图片</span>
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="mt-4 rounded-md border p-3">
            {decodedResult.text && (
              <div className="mt-4 flex flex-col items-center justify-center rounded-md border bg-gray-50 p-4 dark:bg-gray-800">
                <h3 className="mb-2 text-lg font-semibold">解析结果</h3>
                <p className="mb-4 break-all text-center">
                  {decodedResult.text}
                </p>
                {isLink(decodedResult.text) && (
                  <Button
                    className="flex items-center gap-1.5"
                    variant="outline"
                    onClick={handleVisitDecodedUrl}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                    </svg>
                    <span className="text-xs">访问链接</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const CodeLight = ({ content }: { content: string }) => {
  return (
    <>
      <div className="relative -mt-1 mb-2 flex items-center gap-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-950">
        <pre className="text-xs text-neutral-700 dark:text-neutral-300">
          {content}
        </pre>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded bg-neutral-200 px-1 py-0.5 text-xs text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          onClick={() => {
            navigator.clipboard.writeText(content);
            toast.success("已复制到剪贴板!");
          }}
        >
          复制
        </div>
      </div>
    </>
  );
};
