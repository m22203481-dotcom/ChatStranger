import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.chatstranger.chat";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/chat-with-strangers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
  url: `${baseUrl}/anonymous-chat`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.9,
},
{
  url: `${baseUrl}/random-chat`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.9,
},
{
  url: `${baseUrl}/meet-new-people`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.9,
},  
 {
  url: `${baseUrl}/make-friends-online`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.9,
},
{
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}