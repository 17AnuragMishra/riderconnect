import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

const useAxios = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URI,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.user.token}`,
    },
  });

  instance.interceptors.response.use(
    (res) => {
      return res;
    },
    (error) => {
      console.log("req 401", error.request.url);
      if (error.response.status === 401) {
        signOut();
        router.push("/login");
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default useAxios;
