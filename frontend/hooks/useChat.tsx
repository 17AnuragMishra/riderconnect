import useAxios from "./useAxios";
import { Message } from "@/types/message";
import { useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

const fetchChat = async (
  axios: AxiosInstance,
  id: string
): Promise<Message[]> =>
  axios.get(`/messages/group/${id}`).then((response) => response.data.data);

const useChat = (id: string, enabled: boolean) => {
  const instance = useAxios();
  return useQuery({
    queryKey: ["messages", id],
    queryFn: () => fetchChat(instance, id),
    enabled: enabled,
  });
};

export default useChat;
