import { cookies } from "next/headers";

export const createSamlUserSessionCookie = async (userProfile: any) => {
  const cookieStore = await cookies();
  const cookieValue = Buffer.from(JSON.stringify(userProfile)).toString(
    "base64"
  );
  const expires = new Date(Date.now() + 30 * 60 * 1000); // Expires in 30 minutes
  cookieStore.set({
    name: "userSamlSession",
    value: cookieValue,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: expires,
  });
};

export const clearSamlUserSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("userSamlSession");
};

export const getSamlUserSessionFromCookie = async () => {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("userSamlSession");
  if (!userCookie) return null;
  try {
    return JSON.parse(Buffer.from(userCookie.value, "base64").toString());
  } catch (err) {
    console.error("Error parsing user profile from cookie:", err);
    return null;
  }
};
