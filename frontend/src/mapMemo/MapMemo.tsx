import { useSelector } from "react-redux";
import type { RootState } from "../store";

export const MapMemo = () => {
  const message = useSelector((state: RootState) => state.mapmemo.message);
  return <h1>{message}</h1>;
};
