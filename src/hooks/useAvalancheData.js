import useFetchApi from "./useFetchApi";

export default function useAvalancheData() {
  return useFetchApi("/api/avalanche");
}
