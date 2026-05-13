import { useContext } from "react";
import { AuthContext } from "../context/AuthContext"; // adjust path only if your structure is different

export default function useAuth() {
  return useContext(AuthContext);
}
