export interface Episode {
  id: string;
  title: string;
  episode: number;
  length: string;
}

export const SERIES = {
  title: "The Ottoman",
  subtitle: "Kuruluş Osman",
  tagline: "The rise of an empire. The forging of a legend.",
  description:
    "Follow the epic saga of Osman Bey as he lays the foundations of one of history's greatest empires. Battle, betrayal, brotherhood — and the destiny of a dynasty.",
  season: "Season 1 · Episodes 28–64",
};

export const episodes: Episode[] = [
  { id: "l32eRv7O4Xg", title: "The Ottoman", episode: 28, length: "2:22:29" },
  { id: "30KcyrK61eU", title: "The Ottoman", episode: 29, length: "2:25:01" },
  { id: "baDsiIza6xE", title: "The Ottoman", episode: 30, length: "2:22:00" },
  { id: "RYhBjWx68wk", title: "The Ottoman", episode: 31, length: "2:10:47" },
  { id: "UMWd96p0kZE", title: "The Ottoman", episode: 32, length: "2:11:07" },
  { id: "2_VinqU6cLc", title: "The Ottoman", episode: 33, length: "2:11:49" },
  { id: "Eq0_jf70Lnw", title: "The Ottoman", episode: 34, length: "2:09:58" },
  { id: "pauj2Ysd7-M", title: "The Ottoman", episode: 35, length: "2:11:56" },
  { id: "GJil2x8Wffw", title: "The Ottoman", episode: 36, length: "2:14:42" },
  { id: "brTJMrML94o", title: "The Ottoman", episode: 37, length: "2:14:08" },
  { id: "7AKxJJ64WsM", title: "The Ottoman", episode: 38, length: "2:14:11" },
  { id: "QDeOzA5jE8I", title: "The Ottoman", episode: 39, length: "2:41:25" },
  { id: "hDRqLE9tWy0", title: "The Ottoman", episode: 40, length: "2:24:50" },
  { id: "cf6j1Uq7HhA", title: "The Ottoman", episode: 41, length: "2:31:21" },
  { id: "UFqBPE7JXy0", title: "The Ottoman", episode: 42, length: "2:29:13" },
  { id: "KWwEpEx-SEg", title: "The Ottoman", episode: 43, length: "2:26:16" },
  { id: "vQX-_V5qg-I", title: "The Ottoman", episode: 44, length: "2:15:52" },
  { id: "Q5Ywyg4ueSE", title: "The Ottoman", episode: 45, length: "2:14:16" },
  { id: "9oxjEir9t0E", title: "The Ottoman", episode: 46, length: "2:17:38" },
  { id: "W-EfsUTksck", title: "The Ottoman", episode: 47, length: "2:15:22" },
  { id: "6RvbRlwHvbg", title: "The Ottoman", episode: 48, length: "2:32:28" },
  { id: "m3BekC2LOZ4", title: "The Ottoman", episode: 49, length: "2:12:09" },
  { id: "dQfmfXu_Oo4", title: "The Ottoman", episode: 50, length: "2:13:58" },
  { id: "9H-Tl4xQzXc", title: "The Ottoman", episode: 51, length: "2:12:21" },
  { id: "fW1eDMJPAXI", title: "The Ottoman", episode: 52, length: "2:22:29" },
  { id: "qRh1Qg6swPU", title: "The Ottoman", episode: 53, length: "2:16:47" },
  { id: "Xu2RGqkDIoI", title: "The Ottoman", episode: 54, length: "2:16:43" },
  { id: "Rjmte7NzU7k", title: "The Ottoman", episode: 55, length: "2:11:51" },
  { id: "xNXXti8iSqU", title: "The Ottoman", episode: 56, length: "2:19:54" },
  { id: "1YJBHUGmkbE", title: "The Ottoman", episode: 57, length: "2:12:35" },
  { id: "3CzWYEVO2a4", title: "The Ottoman", episode: 58, length: "2:15:57" },
  { id: "c1izj8jr1XQ", title: "The Ottoman", episode: 59, length: "2:17:40" },
  { id: "BxRGXCAFijc", title: "The Ottoman", episode: 60, length: "2:23:29" },
  { id: "aCQ8L3hyQTw", title: "The Ottoman", episode: 61, length: "2:10:42" },
  { id: "kKStk4V6HRU", title: "The Ottoman", episode: 62, length: "2:10:02" },
  { id: "juOuzbcmpqg", title: "The Ottoman", episode: 63, length: "2:11:20" },
  { id: "7Mn1mlrNFgU", title: "The Ottoman", episode: 64, length: "2:21:27" },
];

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const thumbHQ = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
