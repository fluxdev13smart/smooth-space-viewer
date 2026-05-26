export interface Episode {
  id: string;
  title: string;
  episode: number;
  length: string;
  season: number;
}

export const SERIES = {
  title: "The Ottoman",
  subtitle: "Kuruluş Osman",
  tagline: "The rise of an empire. The forging of a legend.",
  description:
    "Follow the epic saga of Osman Bey as he lays the foundations of one of history's greatest empires. Battle, betrayal, brotherhood — and the destiny of a dynasty.",
};

const s1Ids = [
  ["l32eRv7O4Xg", 28, "2:22:29"], ["30KcyrK61eU", 29, "2:25:01"], ["baDsiIza6xE", 30, "2:22:00"],
  ["RYhBjWx68wk", 31, "2:10:47"], ["UMWd96p0kZE", 32, "2:11:07"], ["2_VinqU6cLc", 33, "2:11:49"],
  ["Eq0_jf70Lnw", 34, "2:09:58"], ["pauj2Ysd7-M", 35, "2:11:56"], ["GJil2x8Wffw", 36, "2:14:42"],
  ["brTJMrML94o", 37, "2:14:08"], ["7AKxJJ64WsM", 38, "2:14:11"], ["QDeOzA5jE8I", 39, "2:41:25"],
  ["hDRqLE9tWy0", 40, "2:24:50"], ["cf6j1Uq7HhA", 41, "2:31:21"], ["UFqBPE7JXy0", 42, "2:29:13"],
  ["KWwEpEx-SEg", 43, "2:26:16"], ["vQX-_V5qg-I", 44, "2:15:52"], ["Q5Ywyg4ueSE", 45, "2:14:16"],
  ["9oxjEir9t0E", 46, "2:17:38"], ["W-EfsUTksck", 47, "2:15:22"], ["6RvbRlwHvbg", 48, "2:32:28"],
  ["m3BekC2LOZ4", 49, "2:12:09"], ["dQfmfXu_Oo4", 50, "2:13:58"], ["9H-Tl4xQzXc", 51, "2:12:21"],
  ["fW1eDMJPAXI", 52, "2:22:29"], ["qRh1Qg6swPU", 53, "2:16:47"], ["Xu2RGqkDIoI", 54, "2:16:43"],
  ["Rjmte7NzU7k", 55, "2:11:51"], ["xNXXti8iSqU", 56, "2:19:54"], ["1YJBHUGmkbE", 57, "2:12:35"],
  ["3CzWYEVO2a4", 58, "2:15:57"], ["c1izj8jr1XQ", 59, "2:17:40"], ["BxRGXCAFijc", 60, "2:23:29"],
  ["aCQ8L3hyQTw", 61, "2:10:42"], ["kKStk4V6HRU", 62, "2:10:02"], ["juOuzbcmpqg", 63, "2:11:20"],
  ["7Mn1mlrNFgU", 64, "2:21:27"],
] as const;

const s3Ids = ["y56W71aIgd0","ZZXEbSw1KrI","oqAI2Qaqqyk","GfX3zqhYYhk","kCf15d2KbBo","mAZ2uO9qu5M","duZFBBJDKuA","FO7U9CVl7CU","kT3mXnMeBXM","-gvuDXlYn4Q","moJCiPLNFmc","vUJ1kIJzf64","CffJInc57oE","7dfoqP5z0Eo","XraGwABUYc0","Zn5tR-3tMqU","u5-1ibdnrbo","Irxq4RiKY5I","qLlaUYxIMDI","2LhfrMYDZHM","B2DghXpOMbk","2JJa4LXtv5s","w4CQ0fKNBeU","LA0_b4COZtM","dWESn5qU5FY","U-IsJHh9qik","b7SZfclpHk4","GGY2mPQwN7c","0hJ8s5flRFo","1792MrO0GDQ","NhuBsXZXiCc","ELN1A5JYMCE","0nOrTI3WT1s","Niymd9MYZiI"];

const s4Ids = ["Gu4ibqYYRsg","NykDHjUgkd4","-uOGEdMvtxE","VIBbdXvF7gI","De5jdGmK7Is","Y71fS7xinXE","Mt8Jbydr7K0","iw8WmQQmpJg","HQSISIMishc","XwkpCq81Vzo","Vr3cYuWO6KU","BWZLammV9DA","7mxIkFwqy1Q","mGadII2wd6Y","DxLtEr3OcRI","i-YEad9YqZI","cd8auLvf1rY","tYdkup2l0Wk","0sOdMDtvmaw","yCRKi_NhB28","5RjAtpO_ypQ","c0bTnNbeh4Y","kz3_x_YZ1bw","7qG5v71ukSo","87-Z4k-EOQQ","9EVUvzFZoGs","95CEz3CzwB8","iXL_RMYcr0Q","tsOPKQ6AwN4","3jOwWkZa9YM","p75b2bZtSDQ","_xt6Ucg37o0"];

const s5Ids = ["KH2gvS6BHb8","OYyjHNp4rrk","duHmlPpEVU4","jEL35SYqbRo","oC4smcTviFI","JdO2xRQOgt8","FPYA7k8Q7qc","hu3VLYQgbzc","Rt-PGfzGmfo","-gcKQxH3-W8","Vd9DV5a5kxA","uvTeSe5UDrE","ZF32wYyAvCw","uNzQlWZ1GM4","10S5eNFoTeU","pPBZcbdSvjY","G01LXFz5IRQ","6rB7AChVJ2c","PK1_nQRvl9s","eQVInaoX_68","1ogi5ygIuv0","ol26GyoXgj4","9U7EFQmW8og","2mBGI_uHooQ","KxHKd2lTiTw","aYKI5BQDwl0","n2JHEvD5A6Q","L-YVx99biLc","yZo_OUXsVOk","cQg4IbY3wz4","Z18EJxv-Ne8","7jjiX0aqgnY","puwqgBLvgSc","_byNumfp_x0"];

export const episodes: Episode[] = [
  ...s1Ids.map(([id, ep, length]) => ({ id, episode: ep as number, length: length as string, season: 1, title: SERIES.title })),
  ...s3Ids.map((id, i) => ({ id, episode: i + 1, length: "", season: 3, title: SERIES.title })),
  ...s4Ids.map((id, i) => ({ id, episode: i + 1, length: "", season: 4, title: SERIES.title })),
  ...s5Ids.map((id, i) => ({ id, episode: i + 1, length: "", season: 5, title: SERIES.title })),
];

export const SEASONS = [1, 3, 4, 5] as const;
export const episodesBySeason = (s: number) => episodes.filter((e) => e.season === s);

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const thumbHQ = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
