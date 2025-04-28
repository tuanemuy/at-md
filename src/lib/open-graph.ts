"use server";

import ogs from "open-graph-scraper";

export async function getOG(url: string) {
  "use server";
  try {
    const { result } = await ogs({ url });
    return result;
  } catch (_error) {
    return null;
  }
}
