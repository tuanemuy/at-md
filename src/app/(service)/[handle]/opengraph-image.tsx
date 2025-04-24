import { getUserByHandle } from "@/actions/account";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "OpenGraphImage";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type Props = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function Image({ params }: Props) {
  const { handle } = await params;
  const user = await getUserByHandle(handle);

  const userName = user?.profile.displayName || handle;

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "6rem",
        backgroundColor: "#fafafa",
      }}
    >
      <svg
        viewBox="0 0 69 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          bottom: "6rem",
          right: "6rem",
          height: "3rem",
          width: "8.625rem",
        }}
      >
        <title style={{ display: "none" }}>@md</title>
        <path
          d="M0 12.1703C0 5.45033 5.54813 0 12.3928 0C18.8454 0 24.0922 4.80012 24.0922 10.7457C24.0922 15.4838 22.0719 18.4566 18.9059 18.4566C18.2124 18.4566 16.5238 18.3639 15.589 16.5676C14.5035 18.178 12.9959 18.7044 11.3073 18.7044C8.17149 18.7044 5.63852 15.7935 5.63852 12.2011C5.63852 8.60862 8.1712 5.75973 11.3073 5.75973C12.6942 5.75973 13.7496 6.10024 14.6843 7.06044V6.0386H18.152V13.5329C18.152 14.6167 18.544 15.1433 19.1169 15.1433C20.1722 15.1433 20.8959 13.4402 20.8959 10.746C20.8959 6.1936 18.0313 3.22082 12.3928 3.22082C7.53818 3.22082 3.64847 7.21574 3.64847 12.1706C3.64847 17.4039 7.29694 20.9034 12.0612 20.9034C13.5688 20.9034 15.197 20.5625 16.8554 19.7884L18.0915 22.4515C16.2221 23.5664 14.4128 24 11.9403 24C4.97527 24 0 19.1379 0 12.1703ZM14.6843 12.2014C14.6843 10.3743 13.6891 9.04279 12.1214 9.04279C10.2822 9.04279 9.31721 10.4674 9.31721 12.2014C9.31721 13.9354 10.2822 15.4219 12.1214 15.4219C13.6894 15.4219 14.6843 14.0592 14.6843 12.2014Z"
          fill="#0085FF"
        />
        <path
          d="M29.5977 6.69032H34.3527V8.28028C35.4033 7.05928 37.0345 6.40641 38.6102 6.40641C40.8771 6.40641 42.0936 7.34349 42.7572 8.64954C43.9737 6.83227 45.8535 6.40641 47.2636 6.40641C51.8251 6.40641 52.2122 10.1829 52.2122 13.1074V21.1994H47.1806V13.7036C47.1806 11.9717 46.7106 11.1766 45.6049 11.1766C44.1121 11.1766 43.4207 12.568 43.4207 14.3568V21.1997H38.3891V13.7039C38.3891 11.972 37.9191 11.1769 36.8134 11.1769C35.3203 11.1769 34.6292 12.5683 34.6292 14.3571V21.2H29.5977V6.69032Z"
          fill="#333333"
          className="dark:fill-white"
        />
        <path
          d="M54.0093 13.9591C54.0093 9.75674 56.2764 6.4064 60.2298 6.4064C61.3634 6.4064 62.7732 6.80382 63.6303 7.91131V2.5164H68.6618V21.1994H63.9068V19.581C63.1602 21.0575 61.1975 21.4833 60.0639 21.4833C56.138 21.4833 54.0093 18.133 54.0093 13.9591ZM63.6578 13.9591C63.6578 12.2272 62.7178 10.9493 61.3907 10.9493C60.0636 10.9493 59.1235 12.2269 59.1235 13.9591C59.1235 15.6913 60.0636 16.9405 61.3907 16.9405C62.7178 16.9405 63.6578 15.7195 63.6578 13.9591Z"
          fill="#333333"
          className="dark:fill-white"
        />
      </svg>

      <h1
        style={{
          fontSize: "4.5rem",
          fontWeight: "700",
          lineHeight: "1.4",
        }}
      >
        {userName.slice(0, 64)}
      </h1>

      <p
        style={{
          marginTop: "1rem",
          fontSize: "2rem",
          fontWeight: "700",
          lineHeight: "1.4",
        }}
      >
        @{handle}
      </p>
    </div>,
    {
      ...size,
    },
  );
}
